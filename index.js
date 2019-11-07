const express = require('express');
const bodyParser = require('body-parser');
const db = require('./database/index');

let app = express();

app.use(express.static(__dirname + '/..client/dist'));

app.use(bodyParser.json({
    limit: "50mb", extended: true,
    urlencoded: {limit: '50mb', extended: true}
}))

app.use(bodyParser.urlencoded({ extended: false }))

app.set('trust proxy', true);

let url = "https://c5064749.ngrok.io"

app.get('/', (req, res) => {
    console.log(req, 'REQUEST /')
    res.send("Hello World");
})

app.get('/service', (req, res) => {
    db.serviceSave({
        service: "Donate"
    })
    db.serviceSave({
        service: "Pay It Forward"
    })
    res.send("Thank")
})


app.post('/payItForward', (req, res) => {

    console.log(req.body, 'BODY')
    function commafy( num ) {
        var str = num.toString().split('.');
        if (str[0].length >= 5) {
            str[0] = str[0].replace(/(\d)(?=(\d{3})+$)/g, '$1,');
        }
        if (str[1] && str[1].length >= 5) {
            str[1] = str[1].replace(/(\d{3})/g, '$1 ');
        }
        return str.join('.');
    }

    var amount = JSON.parse(req.body.Memory).twilio.collected_data.collect_comments.answers.amount.answer
    let actions = [];

    if (amount > 20) {
        let actions = {
            "actions": [
                {
                    "redirect": url + "/payItForwardRecapture"
                }
            ]
        }
        res.send(actions);
    } else {
        var totalAmount = commafy(amount);
        if (JSON.parse(req.body.Memory).twilio.sms && !JSON.parse(req.body.Memory).twilio.voice) {
            var phoneNumberSMS = JSON.parse(req.body.Memory).twilio.sms.To.toString().substr(1, 11)   
            console.log(phoneNumberSMS, phoneNumberVoice, amount, "<====================="); 
            db.transactionSave({
                phoneNumber: phoneNumberSMS,
                service: "Pay It Forward",
                amount: amount,
            })
        } else if (JSON.parse(req.body.Memory).twilio.voice && !JSON.parse(req.body.Memory).twilio.sms) {
            var phoneNumberVoice = JSON.parse(req.body.Memory).twilio.voice.From.toString().substr(1, 11)
            console.log(phoneNumberSMS, phoneNumberVoice, amount, "<=====================");
            db.transactionSave({
                phoneNumber: phoneNumberVoice,
                service: "Pay It Forward",
                amount: amount,
            })
        } else {
            console.log('ERROR 404')
        }


        db.Service.findOneAndUpdate(
            { "service": "Pay It Forward" }, 
            {$inc: { "fundraisedAmount": amount }
        }, (err, doc) => {
            if (err) { throw err; }
            else { console.log("Updated"); }
        });  

        
            let say = {
                "collect": {
                    "name": "collect_comments",
                    "questions": [
                        {
                            "question": "Thank you for your purchase of " + totalAmount + " haircuts. Would you like to see the Total Raised so far?",
                            "name": "yesorno",
                            "type": "Twilio.YES_NO"
                        }
                    ],
                    "on_complete": {
                        "redirect": url + "/viewTotalsPayItForward"
                    }
                }
            }



    
        actions.push(say);
        let respObj = {
            "actions": actions
        }
    
        res.send(respObj);
    }
})

app.post('/payItForwardRecapture', (req, res) => {
    console.log('IM HERE')
    let actions = {
        "actions": [
            {
                "say": "At this time, you can only purchase 20 haircuts. Please try again."
            },
            {
                "collect": {
                    "name": "collect_comments",
                    "questions": [
                        {
                            "question": "How many haircuts would you like to donate?",
                            "name": "amount",
                            "type": "Twilio.NUMBER"
                        }
                    ],
                    "on_complete": {
                        "redirect": url + "/payItForward"
                    }
                }
            }
        ]
    }

    res.send(actions)
})

app.post('/viewTotalsPayItForward', (req, res) => {
    function commafy( num ) {
        console.log(num, 'NUMBER IN COMMAFY')
        var str = num.toString().split('.');
        if (str[0].length >= 5) {
            str[0] = str[0].replace(/(\d)(?=(\d{3})+$)/g, '$1,');
        }
        if (str[1] && str[1].length >= 5) {
            str[1] = str[1].replace(/(\d{3})/g, '$1 ');
        }
        return str.join('.');
    }

    var yesorno = JSON.parse(req.body.Memory).twilio.collected_data.collect_comments.answers.yesorno.answer
    console.log(yesorno, 'YES OR NO')
    if (yesorno === 'yes' || yesorno === 'Yes') {
        let totalPayItForward = 0;

        db.Transaction.find({}).exec((err, data) => {
            let bids = []
            for (var i = 0; i < data.length; i ++) {
                if (data[i].service === "Pay It Forward") {
                    totalPayItForward = totalPayItForward + data[i].amount
                } else {
                    console.log('WTF');
                }
            }
            bids.sort((a, b) => b - a)
            console.log(bids, 'BID')
            let actions = [];

    
      	let say = {
			"say": `Currently,  we have received ${totalPayItForward} future haircuts! To learn more about Vagaro follow this link: https://sales.vagaro.com/`
		}



   
    actions.push(say);
    let respObj = {
        "actions": actions
    }
   
    res.send(respObj);
        })
    } else {
        let actions = [];
    
      	let say = {
			"say": `Thanks again for your humble donation! Have a fantastic day!`
		}

        actions.push(say);
        let respObj = {
            "actions": actions
        }

        res.send(respObj);
    }
})

let port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Server is listening on ${port}`);
})