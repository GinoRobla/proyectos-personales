//importar dependencias
require('dotenv').config();
const connection = require("./database/connection");
const express = require("express");
const cors = require("cors");
const path = require("path");

//mensaje de bienvenida
console.log("API Node para red social arrancada!");

//conexion a bdd
connection();

//crear servidor node
const app = express();
const puerto = process.env.PORT || 3900;

//configurar cors
app.use(cors());

//convertir body a json
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configurar carpeta uploads como pública para acceder a las imágenes directamente
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

//configurar rutas
const UserRoutes = require("./routes/user");
const FollowRoutes = require("./routes/follow");
const PublicationRoutes = require("./routes/publication");

app.use("/api/user", UserRoutes);
app.use("/api/follow", FollowRoutes);
app.use("/api/publication", PublicationRoutes);

//poner a escuchar el servidor peticiones y respuestas
app.listen(puerto, () => {
    console.log("Servidor de node corriendo en el puerto " + puerto);
});