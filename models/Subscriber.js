const mongoose = require('mongoose');
const twilio = require('twilio');
const config = require('../config');

// create an authenticated Twilio REST API client
const client = twilio(config.accountSid, config.authToken);

const SubscriberSchema = new mongoose.Schema({
    phone: String,
    subscribed: {
        type: Boolean,
        default: false,
    },
});

// Static function to send a message to all current subscribers
SubscriberSchema.statics.sendMessage = function(message, url, callback) {
    // Find all subscribed users
    Subscriber.find({
        subscribed: true,
    }, function(err, docs) {
        if (err || docs.length == 0) {
            return callback.call(this, {
                message: 'Could not find any subscribers!',
            });
        }

        // Otherwise send messages to all subscribers
        sendMessages(docs);
    });

    // Send messages to all subscribers via Twilio
    function sendMessages(docs) {
        docs.forEach(function(subscriber) {
            // Create options to send the message
            const options = {
                to: subscriber.phone,
                from: config.twilioNumber,
                body: message,
            };

            // Include media URL if one was given for MMS
            if (url) options.mediaUrl = url;

            // Send the message!
            client.messages.create(options)
                .then((message) => console.log(message))
                .catch((error) => console.log(error));
        });

        // Don't wait on success/failure, just indicate all messages have been
        // queued for delivery
        callback.call(this);
    }
};

const Subscriber = mongoose.model('Subscriber', SubscriberSchema);
module.exports = Subscriber;
