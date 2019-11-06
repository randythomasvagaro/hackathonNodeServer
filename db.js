const mongoose = require('mongoose');
const pass = require('../prvt')
// mongoose.connect('mongodb://localhost/twilioHackathon');
mongoose.connect(`mongodb+srv://${pass.email}:${pass.pass}@thehumblebuyers-ephbl.mongodb.net/Hackathon?retryWrites=true&w=majority`)
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('MongoDB has connected');
});
// schemas
const serviceSchema = ({
  service: {type: String, unique: true},
  fundraisedAmount: { type: Number, default: 0 },
});

const transactionSchema = ({
  phoneNumber: Number,
  service: String,
  amount: Number,
  timestamp: { type: Date, default: Date.now },
});

// models
const Service = mongoose.model('Service', serviceSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);

// save functions
function serviceSave(e) {
  console.log(e, 'SAVE FUNC');
  const obj = new Service({
    service: e.service,
    fundraisedAmount: e.fundraisedAmount,
  });
  obj.save();
  console.log('Service saved to MongoDB Database');
}

function transactionSave(e) {
    console.log(e, 'SAVE FUNC');
    const obj = new Transaction({
        phoneNumber: e.phoneNumber,
        service : e.service,
        amount: e.amount
    });
    obj.save();
    console.log('Transaction saved to MongoDB Database');
  }

const funcs = {
  serviceSave,
  Service,
  transactionSave,
  Transaction,
};
module.exports = funcs;
