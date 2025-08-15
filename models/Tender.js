import mongoose from 'mongoose';

export const tenderSchema = new mongoose.Schema({
    TenderId: { type: String, unique: true, index: true },
    DatePublished: String,
    DateModified: String,
    Organizer: {
        Id: String,
        Name: String,
        ContactPerson: { Name: String, Phone: String, Email: String }
    },
    ProzorroNumber: String,
    Category: { title: String },
    LinkToTender: String,
    ImportantDates: Object,
    StatusTitle: String,
    Budget: { AmountTitle: String, VatTitle: String },
    Description: String,
    MinimalStepAmount: String,
    ParticipationCost: String,
    Nomenclatures: [{ Title: String, Count: String }],
    Lots: [{
        LotId: String,
        Title: String,
        Budget: { AmountTitle: String, VatTitle: String },
        Nomenclatures: [{ Title: String, Count: String }]
    }],
    Documents: [{
        Title: String,
        Documents: [{
            Title: String,
            DocumentType: String,
            DownloadUrl: String
        }]
    }],
    OrganizerId: String,
    Comment: { type: String, default: '' },
    Stages: [{
        Name: String,
        DateFrom: String,
        DateTo: String,
        Current: Boolean,
        Complete: Boolean,
        Cancelled: Boolean
    }],
    isArchived: { type: Boolean, default: false }
});

const Tender = mongoose.models.Tender || mongoose.model('Tender', tenderSchema);
export default Tender;
