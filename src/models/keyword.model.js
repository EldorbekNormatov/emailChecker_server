import { Schema, model } from "mongoose";

const KeywordSchema = new Schema(
  {
    words: {
      type: [String],
      required: true,
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const Keyword = model("Keyword", KeywordSchema);
export default Keyword;
