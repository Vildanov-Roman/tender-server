import mongoose from 'mongoose';

const ExampleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    }
}, {
    timestamps: true
});

const Example = mongoose.model('Example', ExampleSchema);

export default Example;