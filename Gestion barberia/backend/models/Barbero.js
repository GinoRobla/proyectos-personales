import mongoose from "mongoose";

const barberoSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      trim: true,
      required: true,
    },
    apellido: {
      type: String,
      trim: true,
      required: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      required: true,
    },
    telefono: {
      type: String,
      trim: true,
      required: true,
    },
    foto: {
      type: String,
      trim: true,
    },
    activo: {
      type: Boolean,
      default: true,
    },
    objetivoMensual: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Campo virtual
barberoSchema.virtual("nombreCompleto").get(function () {
  return `${this.nombre} ${this.apellido}`;
});

// Incluir virtuales en JSON y objetos
barberoSchema.set("toJSON", { virtuals: true });
barberoSchema.set("toObject", { virtuals: true });

const Barbero = mongoose.model("Barbero", barberoSchema);
export default Barbero;
