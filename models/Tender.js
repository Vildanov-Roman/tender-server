import mongoose from 'mongoose';

const tenderSchema = new mongoose.Schema({
    TenderId: { type: String, unique: true },
    DatePublished: String,
    DateModified: String,
    Organizer: {
        Id: String,
        Name: String,
        ContactPerson: {
            Name: String,
            Phone: String,
            Email: String
        }
    },
    ProzorroNumber: String,
    Category: {
        title: String
    },
    LinkToTender: String,
    ImportantDates: Object,
    StatusTitle: String,
    Budget: {
        AmountTitle: String,
        VatTitle: String
    },
    Description: String,
    MinimalStepAmount: String,
    ParticipationCost: String,
    Nomenclatures: Array,
    Lots: Array,
    Documents: Array,
    OrganizerId: String,
    Comment: { type: String, default: '' }
});

export default mongoose.model('Tender', tenderSchema);
