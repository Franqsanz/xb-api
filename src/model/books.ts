import pkg from 'mongoose';
const { Schema, model } = pkg;

export interface BooksDocument extends pkg.Document {
  title: string;
  author: string;
  synopsis: string;
  description: string;
  category: string;
  year: number;
  language: number;
  sourceLink: string;
  numberPages: string;
}

const booksSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  author: {
    type: String,
    required: true
  },
  synopsis: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  category: {
    type: String,
    required: true
  },
  sourceLink: {
    type: String,
    required: true
  },
  language: {
    type: String,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  numberPages: {
    type: Number,
    required: true
  }
  // imgUrl: {
  //   type: Buffer,
  // },
}, { versionKey: false });

booksSchema.set('toJSON', {
  transform: (_, returnedObject) => {
    returnedObject.id = returnedObject._id;
    delete returnedObject._v;
    delete returnedObject._id;
  }
});

export default model<BooksDocument>("books", booksSchema);
