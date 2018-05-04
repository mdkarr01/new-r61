$('#post-search').on('input', function () {
  var search = $(this).serialize();
  if (search === "search=") {
    search = "all"
  }
  $.get('/posts?' + search, function (data) {
    $('#post-grid').html('');
    data.forEach(function (post) {
      $('#post-grid').append(`
        <div class="col-md-3 col-sm-6">
          <div class="thumbnail">
            <img src="${ post.image }">
            <div class="caption">
              <h4>${ post.name }</h4>
            </div>
            <p>
              <a href="/posts/${ post._id }" class="btn btn-primary">More Info</a>
            </p>
          </div>
        </div>
      `);
    });
  });
});

$('#post-search').submit(function (event) {
  event.preventDefault();
});