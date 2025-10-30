// Importar modulos
const fs = require("fs");
const path = require("path");

// Importar modelos
const Publication = require("../models/publication");

// Importar servicios
const followService = require("../services/followService");

// Guardar publicacion
const save = async (req, res) => {
    try {
        // Recoger datos del body
        const params = req.body;

        // SI no me llegan dar respuesta negativa
        if (!params.text) {
            return res.status(400).send({ 
                status: "error", 
                message: "Debes enviar el texto de la publicacion." 
            });
        }

        // Crear y rellenar el objeto del modelo
        let newPublication = new Publication(params);
        newPublication.user = req.user.id;

        // Guardar objeto en bbdd
        const publicationStored = await newPublication.save();

        // Devolver respuesta
        return res.status(200).send({
            status: "success",
            message: "Publicación guardada",
            publication: publicationStored
        });

    } catch (error) {
        console.error(error);
        return res.status(500).send({ 
            status: "error", 
            message: "No se ha guardado la publicación." 
        });
    }
}

// Eliminar publicaciones
const remove = async (req, res) => {
    try {
        // Sacar el id del publicacion a eliminar
        const publicationId = req.params.id;

        // Buscar y eliminar la publicación
        const publicationDeleted = await Publication.findOneAndDelete({ 
            user: req.user.id, 
            _id: publicationId 
        });

        if (!publicationDeleted) {
            return res.status(404).send({
                status: "error",
                message: "No se encontró la publicación o no tienes permisos para eliminarla"
            });
        }

        // Devolver respuesta
        return res.status(200).send({
            status: "success",
            message: "Publicación eliminada correctamente",
            publication: publicationId
        });

    } catch (error) {
        console.error(error);
        return res.status(500).send({
            status: "error",
            message: "Error al eliminar la publicación"
        });
    }
}

// listar publicaciones de un usuario
const user = async (req, res) => {
    try {
        // Sacar el id de usuario
        const userId = req.params.id;

        // Controlar la pagina
        let page = parseInt(req.params.page) || 1;
        const itemsPerPage = 10;

        // Calcular el skip para paginación
        const skip = (page - 1) * itemsPerPage;

        // Find, populate, ordenar, paginar
        const publications = await Publication.find({ user: userId })
            .sort("-created_at")
            .populate('user', '-password -__v -role -email')
            .skip(skip)
            .limit(itemsPerPage);

        const total = await Publication.countDocuments({ user: userId });

        if (!publications || publications.length <= 0) {
            return res.status(404).send({
                status: "error",
                message: "No hay publicaciones para mostrar"
            });
        }

        // Devolver respuesta
        return res.status(200).send({
            status: "success",
            message: "Publicaciones del perfil de un usuario",
            page,
            total,
            pages: Math.ceil(total / itemsPerPage),
            publications
        });

    } catch (error) {
        console.error(error);
        return res.status(500).send({
            status: "error",
            message: "Error al obtener las publicaciones del usuario"
        });
    }
}

// Subir ficheros
const upload = async (req, res) => {
    try {
        // Sacar publication id
        const publicationId = req.params.id;

        // Recoger el fichero de imagen y comprobar que existe
        if (!req.file) {
            return res.status(404).send({
                status: "error",
                message: "Petición no incluye la imagen"
            });
        }

        // Conseguir el nombre del archivo
        let image = req.file.originalname;

        // Sacar la extension del archivo
        const imageSplit = image.split(".");
        const extension = imageSplit[imageSplit.length - 1].toLowerCase();

        // Comprobar extension
        if (!["png", "jpg", "jpeg", "gif"].includes(extension)) {
            // Borrar archivo subido
            const filePath = req.file.path;
            fs.unlinkSync(filePath);

            // Devolver respuesta negativa
            return res.status(400).send({
                status: "error",
                message: "Extensión del fichero invalida"
            });
        }

        // Si es correcta, guardar imagen en bbdd
        const publicationUpdated = await Publication.findOneAndUpdate(
            { user: req.user.id, _id: publicationId }, 
            { file: req.file.filename }, 
            { new: true }
        );

        if (!publicationUpdated) {
            return res.status(500).send({
                status: "error",
                message: "Error en la subida de la imagen"
            });
        }

        // Devolver respuesta
        return res.status(200).send({
            status: "success",
            publication: publicationUpdated,
            file: req.file
        });

    } catch (error) {
        console.error(error);
        return res.status(500).send({
            status: "error",
            message: "Error al subir la imagen"
        });
    }
}

// Devolver archivos multimedia imagenes
const media = (req, res) => {
    // Sacar el parametro de la url
    const file = req.params.file;

    // Montar el path real de la imagen
    const filePath = "./uploads/publications/" + file;

    // Comprobar que existe
    fs.stat(filePath, (error, exists) => {
        if (!exists) {
            return res.status(404).send({
                status: "error",
                message: "No existe la imagen"
            });
        }

        // Devolver un file
        return res.sendFile(path.resolve(filePath));
    });
}

// Listar todas las publicaciones (FEED)
const feed = async (req, res) => {
    try {
        // Sacar la pagina actual
        let page = parseInt(req.params.page) || 1;

        // Establecer numero de elementos por pagina
        let itemsPerPage = 10;

        // Calcular el skip para paginación
        const skip = (page - 1) * itemsPerPage;

        // Sacar un array de identificadores de usuarios que yo sigo como usuario logueado
        const myFollows = await followService.followUserIds(req.user.id);

        // Incluir las publicaciones del usuario logueado junto con las de usuarios que sigue
        const usersToShowPublications = [...myFollows.following, req.user.id];
        
        // Find a publicaciones, ordenar, popular, paginar
        const publications = await Publication.find({ user: { $in: usersToShowPublications } })
            .populate("user", "-password -role -__v -email")
            .sort("-created_at")
            .skip(skip)
            .limit(itemsPerPage);

        const total = await Publication.countDocuments({ user: { $in: usersToShowPublications } });

        if (!publications || publications.length === 0) {
            return res.status(200).send({
                status: "success",
                message: "No hay publicaciones para mostrar",
                following: myFollows.following,
                total: 0,
                page,
                pages: 0,
                publications: []
            });
        }

        return res.status(200).send({
            status: "success",
            message: "Feed de publicaciones",
            following: myFollows.following,
            total,
            page,
            pages: Math.ceil(total / itemsPerPage),
            publications
        });

    } catch (error) {
        console.error(error);
        return res.status(500).send({
            status: "error",
            message: "Error al obtener el feed de publicaciones"
        });
    }
}

// Exportar acciones
module.exports = {
    save,
    remove,
    user,
    upload,
    media,
    feed
}