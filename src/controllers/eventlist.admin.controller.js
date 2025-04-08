res.render('adminPage-eventlist', {
    events: transformedEvents,  // Truyền transformedEvents thay vì events
    currentPage: page,
    hasNextPage: limit * page < totalEvents,
    totalPages: Math.ceil(totalEvents / limit)
});
