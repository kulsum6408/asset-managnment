const CategoryModel = require("../models/categoryModel");

const getAllCategories = async (req, res) => {
    try {
        const categories = await CategoryModel.getAll();
        res.status(200).json(categories);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getCategoryById = async (req, res) => {
    try {
        const category = await CategoryModel.getById(req.params.id);
        if (!category) return res.status(404).json({ error: "Category not found." });
        res.status(200).json(category);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const createCategory = async (req, res) => {
    try {
        const { category_name, description } = req.body;
        if (!category_name || category_name.trim() === "")
            return res.status(400).json({ error: "Category name is required." });

        const existing = await CategoryModel.getByName(category_name.trim());
        if (existing) return res.status(409).json({ error: "Category name already exists." });

        const result = await CategoryModel.create({ category_name: category_name.trim(), description });
        res.status(201).json({ message: "Category created successfully.", category_id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const updateCategory = async (req, res) => {
    try {
        const { category_name, description } = req.body;
        if (!category_name || category_name.trim() === "")
            return res.status(400).json({ error: "Category name is required." });

        const existing = await CategoryModel.getByName(category_name.trim(), req.params.id);
        if (existing) return res.status(409).json({ error: "Category name already exists." });

        const result = await CategoryModel.update(req.params.id, { category_name: category_name.trim(), description });
        if (result.affectedRows === 0) return res.status(404).json({ error: "Category not found." });

        res.status(200).json({ message: "Category updated successfully." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const deleteCategory = async (req, res) => {
    try {
        const category = await CategoryModel.getById(req.params.id);
        if (!category) return res.status(404).json({ error: "Category not found." });

        if (category.asset_count > 0)
            return res.status(400).json({ error: `Cannot delete category. It is attached to ${category.asset_count} asset(s).` });

        await CategoryModel.delete(req.params.id);
        res.status(200).json({ message: "Category deleted successfully." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { getAllCategories, getCategoryById, createCategory, updateCategory, deleteCategory };
