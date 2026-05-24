import Note from "../models/Note.js";

export const getNotes = async (req, res) => {
  try {
    const notes = await Note.find({ userId: req.user.id }).sort({ pinned: -1, updatedAt: -1 });
    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createNote = async (req, res) => {
  try {
    const { title, content, pdfId } = req.body;
    const note = await Note.create({
      title,
      content,
      pdfId,
      userId: req.user.id
    });
    res.status(201).json(note);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, pinned, pdfId } = req.body;
    const note = await Note.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      { title, content, pinned, pdfId },
      { new: true }
    );
    if (!note) return res.status(404).json({ message: "Note not found" });
    res.json(note);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteNote = async (req, res) => {
  try {
    const { id } = req.params;
    const note = await Note.findOneAndDelete({ _id: id, userId: req.user.id });
    if (!note) return res.status(404).json({ message: "Note not found" });
    res.json({ message: "Note deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
