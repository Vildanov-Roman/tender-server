import Example from '../models/ExampleModel.js';

// Create new item
export const createItem = async (req, res) => {
    try {
        const newItem = new Example(req.body);
        const savedItem = await newItem.save();
        res.status(201).json(savedItem);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Get all items
export const getItems = async (req, res) => {
    try {
        const items = await Example.find();
        res.json(items);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update item
export const updateItem = async (req, res) => {
    try {
        const item = await Example.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        res.json(item);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete item
export const deleteItem = async (req, res) => {
    try {
        await Example.findByIdAndDelete(req.params.id);
        res.json({ message: 'Item deleted successfully' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};