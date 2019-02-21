const socket = io();

function scrollToBottom() {
	const messages = jQuery('#messages');
	const newMessage = messages.children('li:last-child')
	const clientHeight = messages.prop('clientHeight');
	const scrollTop = messages.prop('scrollTop')
	const scrollHeight = messages.prop('scrollHeight');

	const newMessageHeight = newMessage.innerHeight();
	const lastMessageHeight = newMessage.prev().innerHeight();

	if (clientHeight + scrollTop + lastMessageHeight + newMessageHeight >= scrollHeight) {
		messages.scrollTop(scrollHeight);
	}
}

socket.on('connect', function () {
	const params = jQuery.deparam(window.location.search);

	socket.emit('join', params, function (err) {
		if (err) {
			alert(err);
			window.location.href = '/';
		} else {
			console.log('No errors');
		}
	});

	console.log('Connected to Server');

	socket.on('newMessage', function (message) {
		const formattedTime = moment(message.createdAt).format('h:mm:a');
		const template = jQuery('#message-template').html();
		const html = Mustache.render(template, {

			text: message.text,
			from: message.from,
			createdAt: formattedTime
		});

		jQuery('#messages').append(html);

		scrollToBottom();
	})

	socket.on('newNotice', function (message) {
		const formattedTime = moment(message.createdAt).format('h:mm:a');
		const template = jQuery('#notice-template').html();
		const html = Mustache.render(template, {
			text: message.text,
			createdAt: formattedTime
		});

		jQuery('#messages').append(html);
	})
});

socket.on('updateUserList', function (users) {
	const ol = jQuery('<ol></ol>');
	users.forEach(function (user) {
		ol.append(jQuery('<li></li>').text(user));
	});

	jQuery('#users').html(ol);
});

socket.on('newLocationMessage', function (message) {

	const formattedTime = moment(message.createdAt).format('h:mm:a');
	const template = jQuery('#location-message-template').html();
	const html = Mustache.render(template, {
		text: message.url,
		from: message.from,
		createdAt: formattedTime
	});

	jQuery('#messages').append(html);

	scrollToBottom();
});

socket.on('disconnect', function () {
	console.log('Disconnected from Server');
});

jQuery('#message-form').on('submit', function (e) {
	e.preventDefault();

	const messageTextbox = jQuery('[name=message]')

	socket.emit('createMessage', {
		text: jQuery('[name=message]').val()
	}, function () {
		messageTextbox.val('')
	});
});

const locationButton = jQuery('#send-location');
locationButton.on('click', function () {

	if (!navigator.geolocation) {
		return alert('Geolocation not supported or denied by your browser');
	}

	locationButton.attr('disabled', 'disabled').text('Sending location...');

	navigator.geolocation.getCurrentPosition(function (position) {
		locationButton.removeAttr('disabled').text('Send Location');
		socket.emit('createLocationMessage', {

			latitude: position.coords.latitude,
			longitude: position.coords.longitude
		});

	}, function () {

		locationButton.attr('disabled', 'disabled').text('Second Location');
		alert('Unable to fetch location');
	});
});