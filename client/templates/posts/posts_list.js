Template.postsList.rendered = function () {
  this.find('.wrapper')._uihooks = {
    insertElement: function (node, next) {
      $(node)
        .hide()
        .insertBefore(next)
        .fadeIn();
    },
    moveElement: function (node, next) {
      var $node = $(node), $next = $(next);
      var oldTop = $node.offset().top;
      var height = $(node).outerHeight(true);
      
      // find all the elements between next and node
      var $inBetween = $(next).nextUntil(node);
      if ($inBetween.length === 0)
        $inBetween = $(node).nextUntil(next);
      
      // now put node in place
      $(node).insertBefore(next);
      
      // measure new top
      var newTop = $(node).offset().top;
      
      // move node *back* to where it was before
      $(node)
        .removeClass('animate')
        .css('top', oldTop - newTop);
      
      // push every other element down (or up) to put them back
      $inBetween
        .removeClass('animate')
        .css('top', oldTop < newTop ? height : -1 * height)
        
      
      // force a redraw
      $(node).offset();
      
      // reset everything to 0, animated
      $(node).addClass('animate').css('top', 0);
      $inBetween.addClass('animate').css('top', 0);
    },
    removeElement: function(node) {
      $(node).fadeOut(function() {
        $(this).remove();
      });
    }
  }
}

Template.postsListItem.helpers({
  count: function (nActions, action) {
    return nActions[action] || 0;
  },
  reported: function () {
    return this.status == 'reported';
  },
  seed: function (seeds, action) {
    seeds = seeds || {};
    return seeds[action] || 1;
  },
  actions: function () {
    this.actions.push('_light');
    return this.actions;
  }
})

Template.postsListItem.events({
  'dblclick .post-title': function (e) {
    if (confirm('确认删除？')) {
      Posts.update(this._id, {$set: {status: 'deleted'}});
    }
  },
  'click .set-stars': function (e) {
    var stars = parseInt(prompt('输入星级：', '1 ~ 7'));
    if (stars)
      Posts.update(this._id, {$set: {stars: stars}});   
  },
  'click .set-seed': function (e) {
    var post = $(e.target).data('id');
    var seed = parseInt(prompt('输入比例值：', '1 ~ 10'));
    var action = $(e.target).data('action');
    if (seed){
      var val = {};
      val['seeds.'+action] = seed;
      console.log(val);
      console.log(this);
      Posts.update(post, {$set: val});   
    }
  },
  'click a.forbid': function (e) {
    if (confirm('确认封禁？')) {
      Posts.update(this._id, {$set: {status: 'forbidden'}});
    }
  }
})
