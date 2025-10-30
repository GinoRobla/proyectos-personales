const bcrypt = require("bcrypt");
const User = require("../models/user");
const jwt = require("../services/jwt");
const fs = require("fs");
const path = require("path");

const register = async (req, res) => {
    const params = req.body;

    if (params.name && params.email && params.password && params.nick) {
        try {
            // Verificar si el usuario ya existe
            const existingUser = await User.findOne({
                $or: [
                    { email: params.email.toLowerCase() },
                    { nick: params.nick.toLowerCase() }
                ]
            });

            if (existingUser) {
                return res.status(400).json({
                    status: "error",
                    message: "Ya existe un usuario con ese correo o nick."
                });
            }
            //cifrar contraseña
            let pwd = await bcrypt.hash(params.password, 10);
            params.password = pwd;

            // Crear objeto de usuario
            let userToSave = new User(params);

            // Guardar usuario en la base de datos
            const savedUser = await userToSave.save();
            // Eliminar la contraseña del objeto de respuesta
            const userResponse = savedUser.toObject();
            delete userResponse.password;
            return res.status(200).json({
                status: "success",
                message: "Usuario creado correctamente",
                user: userResponse
            });

        } catch (error) {
            return res.status(500).json({
                status: "error",
                message: "Error al crear el usuario"
            });
        }
    }else {
        return res.status(400).json({
            status: "error",
            message: "Faltan datos por enviar"
        });
    }
};

const login = async (req, res) => {
    const params = req.body;

    if (params.email && params.password) {
        try {
            // Buscar el usuario por correo
            const user = await User.findOne({ email: params.email.toLowerCase() });

            if (!user) {
                return res.status(404).json({
                    status: "error",
                    message: "Usuario no encontrado"
                });
            }

            // Verificar la contraseña
            const pwd = await bcrypt.compare(params.password, user.password);

            if (!pwd) {
                return res.status(401).json({
                    status: "error",
                    message: "Contraseña incorrecta"
                });
            }

            const token = jwt.createToken(user);

            return res.status(200).json({
                status: "success",
                message: "Login exitoso",
                user:{
                    id: user._id,
                    name: user.name,
                    nick: user.nick,
                },
                token
            });

        } catch (error) {
            return res.status(500).json({
                status: "error",
                message: "Error al iniciar sesión"
            });
        }
    } else {
        return res.status(400).json({
            status: "error",
            message: "Faltan datos por enviar"
        });
    }
}

const getProfile = async (req, res) => {
    const userId = req.params.id;

    if (!userId) {
        return res.status(400).json({
            status: "error",
            message: "Faltan datos por enviar"
        });
    }

    try {
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                status: "error",
                message: "Usuario no encontrado"
            });
        }

        return res.status(200).json({
            status: "success",
            user
        });

    } catch (error) {
        return res.status(500).json({
            status: "error",
            message: "Error al obtener el perfil"
        });
    }
}

const list = async (req, res) => {
    let page = parseInt(req.params.page) || 1;
    const itemsPerPage = 10;

    try {
        const users = await User.find()
            .skip((page - 1) * itemsPerPage)
            .limit(itemsPerPage);

        const total = await User.countDocuments();

        return res.status(200).json({
            status: "success",
            users,
            page,
            itemsPerPage,
            total,
            pages: Math.ceil(total / itemsPerPage)
        });
    } catch (error) {
        return res.status(500).json({
            status: "error",
            message: "Error al listar los usuarios"
        });
    }
};

const update = async (req, res) => {
    const userId = req.user.id; 
    const params = req.body;

    try {
        // Verificar si el nuevo email o nick ya están en uso por otro usuario
        const existingUser = await User.findOne({
            $or: [
                { email: params.email?.toLowerCase() },
                { nick: params.nick?.toLowerCase() }
            ],
            _id: { $ne: userId } // Excluir el usuario actual
        });

        if (existingUser) {
            return res.status(400).json({
                status: "error",
                message: "El email o nick ya están en uso por otro usuario"
            });
        }

        // Si se va a cambiar la contraseña, cifrarla
        if (params.password) {
            params.password = await bcrypt.hash(params.password, 10);
        }

        // Actualizar usuario y devolver el nuevo documento
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            params,
            { new: true } // Para devolver el usuario actualizado
        );

        if (!updatedUser) {
            return res.status(404).json({
            status: "error",
            message: "Usuario no encontrado"
        });
}

        return res.status(200).json({
            status: "success",
            message: "Usuario actualizado correctamente",
            user: updatedUser
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: "error",
            message: "Error al actualizar el usuario"
        });
    }
};

const upload = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                status: "error",
                message: "No se ha subido ninguna imagen"
            });
        }

        let image = req.file.originalname;
        const imageSplit = image.split(".");
        const extension = imageSplit[imageSplit.length - 1].toLowerCase();

        // Validar extensión
        if (!["png", "jpg", "jpeg", "gif"].includes(extension)) {
            fs.unlinkSync(req.file.path); // Eliminar si no es válida

            return res.status(400).json({
                status: "error",
                message: "Extensión de imagen no válida. Solo se permiten PNG, JPG, JPEG y GIF."
            });
        }

        // Verificar que el usuario solo pueda actualizar su propia imagen
        const userId = req.params.id;
        if (req.user.id !== userId) {
            fs.unlinkSync(req.file.path); // Eliminar el archivo subido
            return res.status(403).json({
                status: "error",
                message: "No tienes permisos para actualizar este usuario"
            });
        }

        // Actualizar usuario con la nueva imagen
        const userUpdated = await User.findByIdAndUpdate(
            userId,
            { image: req.file.filename },
            { new: true }
        );

        if (!userUpdated) {
            return res.status(404).json({
                status: "error",
                message: "Usuario no encontrado"
            });
        }

        return res.status(200).json({
            status: "success",
            user: userUpdated,
            file: req.file
        });

    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({
            status: "error",
            message: "Error al subir la imagen"
        });
    }
};

const getAvatar = (req, res) => {
    const file = req.params.file;
    const filePath = "./uploads/avatars/"+ file;

    fs.stat(filePath, (error, stats) => {
    if (error) {
        return res.status(404).json({
            status: "error",
            message: "La imagen no existe"
        });
    }
    return res.sendFile(path.resolve(filePath));
    });
};

const counters = async (req, res) => {
    const userId = req.params.id;

    try {
        // Importar modelos solo cuando sea necesario
        const Follow = require("../models/follow");
        const Publication = require("../models/publication");

        // Contar seguidores
        const following = await Follow.countDocuments({ user: userId });

        // Contar seguidos
        const followed = await Follow.countDocuments({ followed: userId });

        // Contar publicaciones
        const publications = await Publication.countDocuments({ user: userId });


        return res.status(200).json({
            status: "success",
            userId,
            counters: {
                following,
                followed,
                publications
            }
        });

    } catch (error) {
        return res.status(500).json({
            status: "error",
            message: "Error en los contadores"
        });
    }
}

module.exports = {
    register,
    login,
    getProfile,
    list,
    update,
    upload,
    getAvatar,
    counters
};