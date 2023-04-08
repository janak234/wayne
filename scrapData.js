const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const fs = require('fs');
const lockfile = require('proper-lockfile');


class DataFileIO {
    constructor() {
        this.filePath = 'data.json';
    }

    async readData() {
        const release = await lockfile.lock(this.filePath);
        const data = JSON.parse(fs.readFileSync(this.filePath));
        release();
        return data;
    }

    async writeData(data) {
        const release = await lockfile.lock(this.filePath);
        fs.writeFileSync(this.filePath, JSON.stringify(data));
        release();
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
        await this.page.screenshot({ path: 'screenshots/checkbox.png' });
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

        this.dataFileIO = new DataFileIO();
    }

    async visit() {
        console.log("loading page");
        await this.page.goto(this.url, { timeout: 0, waitUntil: 'load' });
        console.log("page loaded")
        // take screenshot
        await this.page.screenshot({ path: 'screenshots/list.png' });
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
            await this.dataFileIO.writeData(data);
        } catch (error) {
            console.log(error);
        }
    }
}

async function getDataFromCourtWebsite() {
    // Launch a new browser instance
    const browser = await puppeteer.launch({ headless: true });

    // Create a new page
    const page = await browser.newPage();

    const termsAndConditionPage = new TermsAndConditionPage(page);
    await termsAndConditionPage.doJob();

    // Wait for page to load
    await page.waitForNavigation();

    const courtListingPage = new CourtListingPage(page);
    await courtListingPage.doJob();

    // Close the browser instance
    await browser.close();
}

module.exports = {getDataFromCourtWebsite,DataFileIO};