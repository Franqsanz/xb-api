import pkg from 'mongoose';
const { Schema, model } = pkg;

import { BooksDocument } from '../types';

const booksSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  authors: {
    type: [String],
    required: true,
    trim: true,
    default: []
  },
  synopsis: {
    type: String,
    required: true,
  },
  category: {
    type: [String],
    required: true,
    default: []
  },
  sourceLink: {
    type: String,
    trim: true,
  },
  language: {
    type: String,
    required: true,
  },
  year: {
    type: Number,
    required: true,
    min: 1800,
    max: 2050,
  },
  numberPages: {
    type: Number,
    required: true,
    min: 49,
  },
  format: {
    type: String,
    require: true,
  },
  pathUrl: {
    type: String,
    require: true,
    trim: true,
  },
  image: {
    url: {
      type: String,
      required: true,
    },
    public_id: {
      type: String,
    }
  },
  userId: {
    type: String,
    // required: true,
  },
  views: {
    type: Number,
    default: 0
  }
}, { versionKey: false, });

booksSchema.set('toJSON', {
  transform: (_, returnedObject) => {
    returnedObject.id = returnedObject._id;
    delete returnedObject._v;
    delete returnedObject._id;
  }
});

export default model<BooksDocument>('books', booksSchema);
