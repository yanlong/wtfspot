Template.insertActionName.events({
	'click button': function (e) {
		var name = $('input').val();
		ActionNames.insert({
			name: name,
		})
	}
})

Template.actionNameListItem.events({
	'dblclick .name': function (e) {
		if (confirm('确认删除？')) {
			ActionNames.remove($(e.target).data('id'));
		}
	}
})