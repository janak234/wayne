const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const { PrismaClient } = require('@prisma/client')

const prismaClient = new PrismaClient();

const ACTION_DATE = new Date("2000-01-01");


class DataBaseIO {

    constructor() {
        this.prisma = prismaClient;
    }

    async readDatabyDate(date) {
        const data = await this.prisma.court.findMany({
            where: {
                date: this.resetTimeToDate(date),
            },
            include: {
                civilListing: true,
                criminalListing: true,
            }
        });
        return data;
    }

    // read data for action
    async readDataForAction(){
        const data = await this.prisma.court.findMany({
            where: {
                date: this.resetTimeToDate(ACTION_DATE),
            },
            include: {
                civilListing: true,
                criminalListing: true,
            }
        });
        return data;
    }

    async searchRecord(query, startDate, endDate) {
        const data = await this.prisma.court.findMany({
            where: {
                OR: [
                    {
                        civilListing: {
                            some: {
                                matterTitle: {
                                    contains: query,
                                },
                            },
                        },
                    },
                    {
                        criminalListing: {
                            some: {
                                name: {
                                    contains: query,
                                },
                            },
                        },
                    },
                ],
                date: {
                    gte: this.resetTimeToDate(startDate),
                    lte: this.resetTimeToDate(endDate),
                }
            },
            include: {
                civilListing: {
                    where: {
                        matterTitle: {
                            contains: query,
                        },
                    },
                },
                criminalListing: {
                    where: {
                        name: {
                            contains: query,
                        },
                    },
                },
            }
        });

        // add 1 day to each date
        data.forEach((court) => {
            court.date.setDate(court.date.getDate() + 1);
        });

        return data;

    }

    async addCriminalRecords(criminalListing, court) {
        // Loop through each criminal listing for this court type and create it in the database
        await this.prisma.criminalListing.createMany({
            data: criminalListing.map((listing) => ({
                time: listing.time,
                name: listing.name,
                floorCourt: listing.floorCourt,
                courtId: court.id,
            }))
        })
    }

    async addCivilRecords(civilListings, court) {
        // Loop through each civil listing for this court type and create it in the database
        await this.prisma.civilListing.createMany({
            data: civilListings.map((listing) => ({
                time: listing.time,
                matterTitle: listing.matterTitle,
                matterNo: listing.matterNo,
                floorCourt: listing.floorCourt,
                courtId: court.id,
            }))
        })
    }

    async upsertCourt(courtName, buildingName, address, storeDate=new Date()) {
        // Try to find a court in the database with the same name and building name
        let existingCourt = await this.prisma.court.findFirst({
            where: {
                name: courtName,
                buildingName: buildingName,
                date: this.resetTimeToDate(storeDate),
            }
        })

        // If a court with this name and building name does not already exist in the database, create it
        if (!existingCourt) {
            existingCourt = await this.prisma.court.create({
                data: {
                    name: courtName,
                    buildingName: buildingName,
                    address: address,
                    date: this.resetTimeToDate(storeDate),
                },
            })
        }

        return existingCourt
    }

    async writeData(data, storeDate=new Date()) {
        // Delete all existing courts and listings for today
        await this.prisma.court.deleteMany({
            where: {
                date: this.resetTimeToDate(storeDate),
            }
        });

        // Loop through each court type in the data object
        for (const courtName in data) {
            if (data.hasOwnProperty(courtName)) {
                const courtBuildings = data[courtName]

                courtBuildings.forEach(async (building, i) => {
                    const buildingName = building.buildingName;
                    const address = building.address;
                    const civilListing = building.civilListing;
                    const criminalListing = building.criminalListing;

                    // Upsert the court into the database
                    const court = await this.upsertCourt(courtName, buildingName, address, storeDate);

                    await this.addCivilRecords(civilListing, court);

                    await this.addCriminalRecords(criminalListing, court);
                });
            }
        }
    }

    resetTimeToDate(date) {
        // 6 PM
        date.setHours(18);
        date.setMinutes(0);
        date.setSeconds(0);
        date.setMilliseconds(0);
        return date;
    }

    isValidEmail(email) {
        const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
        return emailRegex.test(email);
    }

    // get keywords for a user
    async getUserAlerts() {

        const usersWithAlerts = await this.prisma.appUser.findMany({
            select: {
                email: true,
                username: true,
                alerts: {
                    select: {
                        text: true
                    }
                }
            }
        });

        // users with alert list
        const result = usersWithAlerts.filter(user => this.isValidEmail(user.email)).map(user => {
            return {
                email: user.email,
                name: user.username,
                alerts: user.alerts.map(alert => alert.text)
            }
        })

        return result;
    }

    // returns alert for a user if any for a given date
    async getUserActiveAlerts(date) {
        const userAlerts = await this.getUserAlerts();

        /** 
         * { 
         *      username, useremail, 
         *      listOfActiveAlerts[string], 
         *      criminalAlerts[string], 
         *      civilAlerts[string] 
         * } 
         */
        const userActiveAlerts = [];     

        for (const userAlert of userAlerts) {
            const _alerts = userAlert.alerts;
            const activeAlerts = [];
            const criminalAlerts = [];
            const civilAlerts = [];

            for (const alert of _alerts) {
                const result = await this.prisma.court.findMany({
                    select:{
                        name:true,
                        civilListing:{
                            select:{
                                matterTitle:true
                            }
                        },
                        criminalListing:{
                            select:{
                                name:true
                            }
                        }
                    },
                    where: {
                        date: this.resetTimeToDate(date),
                        OR: [
                            {
                                civilListing: {
                                    some: {
                                        matterTitle: {
                                            contains: alert,
                                        }
                                    },
                                },
                            },
                            {
                                criminalListing: {
                                    some: {
                                        name: {
                                            contains: alert,
                                        }
                                    },
                                },
                            },
                        ],
                    },
                })

                if (result.length > 0) {
                    activeAlerts.push(alert);

                    result.forEach((court) => {
                        court.civilListing.forEach((civil) => {
                            if(civil.matterTitle.includes(alert)){
                                civilAlerts.push(civil.matterTitle);
                            }
                        });
                        court.criminalListing.forEach((criminal) => {
                            if(criminal.name.includes(alert)){
                                criminalAlerts.push(criminal.name);
                            }
                        });
                    });
                }
            }
            userActiveAlerts.push({
                email: userAlert.email,
                name: userAlert.name,
                alerts: activeAlerts,
                civilAlerts: civilAlerts,
                criminalAlerts: criminalAlerts
            });
        }
        return {
            userActiveAlerts
        };
    }
}

class TermsAndConditionPage {
    constructor(page) {
        this.page = page;
        this.checkbox = 'input#chkRead';
        this.submitBtn = "input#btnAgreed";
        this.url = "https://ecourts.justice.wa.gov.au/eCourtsPortal/CourtListings/TodaysCourtListings";
    }

    async visit() {
        console.log("loading page");
        await this.page.goto(this.url, { timeout: 0, waitUntil: 'load' });
        console.log("page loaded")
    }

    async acceptTermsAndConditions() {
        // Get checkbox using a selector
        await (await this.page.$(this.checkbox)).click();

        // take screenshot
        if (process.env.NODE_ENV == "development") {
            await this.page.screenshot({ path: 'screenshots/checkbox.png' });
        }
    }

    async submit() {
        console.log("click on submit button");
        // Get button using a selector
        await (await this.page.$(this.submitBtn)).click();
    }

    async doJob() {
        await this.visit();
        await this.acceptTermsAndConditions();
        await this.submit();
    }
}


class CourtListingPage {
    constructor(page) {
        this.page = page;
        this.url = "file:///C:/Users/janak/Desktop/Wayne/webpage/aus/court.html";

        this.allListing = "[data-id='all-listings']";
        this.panelHeader = ".panel-header";
        this.panelGroup = ".panel-group";
        this.listHeader = ".list-header";
        this.listSubHeader = ".list-sub-header";
        this.criminalTable = ".criminal-table";
        this.civilTable = ".civil-table";

        this.databaseIO = new DataBaseIO();
    }

    async visit() {
        console.log("loading page");
        await this.page.goto(this.url, { timeout: 0, waitUntil: 'load' });
        console.log("page loaded")
        // take screenshot
        if (process.env.NODE_ENV == "development") {
            await this.page.screenshot({ path: 'screenshots/list.png' });
        }
    }

    async getListing() {
        var htmlPage = await this.page.content();
        var data = this.parseData(htmlPage);
        return data;
    }

    // scrap rows from civil table
    getCivilListing(civilTable, $) {
        var data = civilTable.find("tbody tr.data-row").map((i, row) => {
            const cells = $(row).find('td');
            return {
                time: cells.eq(0).text().trim(),
                matterTitle: cells.eq(1).text().trim(),
                matterNo: cells.eq(2).text().trim(),
                floorCourt: cells.eq(3).text().trim()
            };
        }).get();
        return data;
    }

    // scrap rows from criminal table
    getCriminalListing(criminalTable, $) {
        var data = criminalTable.find("tbody tr.data-row").map((i, row) => {
            const cells = $(row).find('td');
            return {
                time: cells.eq(0).text().trim(),
                name: cells.eq(1).text().trim(),
                floorCourt: cells.eq(2).text().trim()
            };
        }).get();
        return data;
    }

    parseData(html) {
        // Load the HTML code into Cheerio
        const $ = cheerio.load(html);
        const result = {};

        // Find all the panels with the "panel-header" class
        $(this.allListing).find(this.panelHeader).map((i, panelHeader) => {
            // Get the court name
            const courtName = $(panelHeader).text().trim();

            // Find all the panels that follow this header and have the "panel-group" class
            const groups = $(panelHeader).nextUntil(this.panelHeader, this.panelGroup).map((i, group) => {
                var buildingname = $(group).find(this.listHeader).text();
                var address = $(group).find(this.listSubHeader).text();

                var civilListingData = this.getCivilListing($(group).find(this.civilTable), $);
                var criminalListingData = this.getCriminalListing($(group).find(this.criminalTable), $);

                return {
                    buildingName: buildingname,
                    address: address,
                    civilListing: civilListingData,
                    criminalListing: criminalListingData
                }
            }).get();

            // Add the court and its groups to the result object
            result[courtName] = groups;
        });
        return result;
    }

    async doJob() {
        // await this.visit();
        try {
            var data = await this.getListing();
            await this.databaseIO.writeData(data);
        } catch (error) {
            console.log(error);
        }
    }

    async doJobAction() {
        try {
            var data = await this.getListing();
            await this.databaseIO.writeData(data,ACTION_DATE);
        } catch (error) {
            console.log(error);
        }
    }
}

async function _getDataFromCourtWebsite(isAction = false) {
    // Launch a new browser instance
    var browser;

    if (process.env.NODE_ENV === 'production') {
        browser = await puppeteer.launch({
            headless: true,
            executablePath: '/usr/bin/google-chrome',
            args: [
                "--no-sandbox",
                "--disable-gpu",
            ]
        });
    } else {
        browser = await puppeteer.launch({ headless: true });
    }

    // Create a new page
    const page = await browser.newPage();

    const termsAndConditionPage = new TermsAndConditionPage(page);
    await termsAndConditionPage.doJob();

    // Wait for page to load
    await page.waitForNavigation();

    const courtListingPage = new CourtListingPage(page);

    console.log("started scrapping");

    if(isAction){
        await courtListingPage.doJobAction();
    }else{
        await courtListingPage.doJob();
    }

    console.log("scrapping completed, data saved");
    // Close the browser instance
    await browser.close();
}

async function getDataFromCourtWebsite() {
    await _getDataFromCourtWebsite();
}

async function getDataFromCourtWebsiteAction() {
    await _getDataFromCourtWebsite(isAction = true);
}

module.exports = { getDataFromCourtWebsite, DataBaseIO, getDataFromCourtWebsiteAction,ACTION_DATE };