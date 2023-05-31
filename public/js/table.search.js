$(document).ready(function () {
    $('#tabs').tabs();

    // search functionality
    function performSearch(listing, query, isListing) {
        listing.find('.is-data-row').each(function () {
            if (isListing($(this), query)) {
                $(this).show();
                $(this).closest('.my-table').show(); // show parent table
            } else {
                $(this).hide();
                var table = $(this).closest('.my-table');
                var hasVisibleRows = table.find('.is-data-row:visible').length > 0;
                if (!hasVisibleRows) {
                    table.hide(); // hide parent table
                }
            }
        });
    }

    $('#my-search-input').on('keyup', function () {
        var query = $(this).val().toLowerCase();

        //- var isGLobalSearchEnabled = $('#isGlobalSearch').prop('checked');
        var isGLobalSearchEnabled = false;

        if (!isGLobalSearchEnabled) {
            performSearch($('#criminal-listing'), query, (row, query) => {
                var criminalName = row.find('.my-criminal-name').text().toLowerCase();
                return criminalName.includes(query)
            });

            performSearch($('#civil-listing'), query, (row, query) => {
                var matterTitle = row.find('.my-matter-title').text().toLowerCase();
                // remove 2 spaces and replace with 1 space
                var matterNo = row.find('.my-matter-no').text().toLowerCase().replace(/ {2}/g, " ");
                return matterTitle.includes(query) || matterNo.includes(query)
            });
        }

    });
});