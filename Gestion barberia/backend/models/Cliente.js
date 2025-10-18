import mongoose from "mongoose";

const clienteSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    apellido: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Email inválido"],
    },
    telefono: {
      type: String,
      required: true,
      trim: true,
    },
    activo: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Índices
clienteSchema.index({ email: 1 });
clienteSchema.index({ telefono: 1 });

// Campo virtual
clienteSchema.virtual("nombreCompleto").get(function () {
  return `${this.nombre} ${this.apellido}`;
});

// Incluir virtuales en JSON y objetos
clienteSchema.set("toJSON", { virtuals: true });
clienteSchema.set("toObject", { virtuals: true });

const Cliente = mongoose.model("Cliente", clienteSchema);
export default Cliente;
