// Importar modelo
const Follow = require("../models/follow");
const User = require("../models/user");

// Importar servicio
const followService = require("../services/followService");

// Accion de guardar un follow (accion seguir)
const save = async (req, res) => {
    try {
        // Conseguir datos por body
        const params = req.body;

        // Sacar id del usuario identificado
        const identity = req.user;

        // Verificar que no se trate de seguir a sí mismo
        if (identity.id === params.followed) {
            return res.status(400).send({
                status: "error",
                message: "No puedes seguirte a ti mismo"
            });
        }

        // Verificar que el usuario a seguir existe
        const userToFollow = await User.findById(params.followed);
        if (!userToFollow) {
            return res.status(404).send({
                status: "error",
                message: "Usuario no encontrado"
            });
        }

        // Verificar que no ya lo sigue
        const existingFollow = await Follow.findOne({
            user: identity.id,
            followed: params.followed
        });

        if (existingFollow) {
            return res.status(400).send({
                status: "error",
                message: "Ya sigues a este usuario"
            });
        }

        // Crear objeto con modelo follow
        let newFollow = new Follow({
            user: identity.id,
            followed: params.followed
        });

        // Guardar objeto en bbdd
        const followStored = await newFollow.save();

        return res.status(200).send({
            status: "success",
            identity: req.user,
            follow: followStored
        });

    } catch (error) {
        console.error(error);
        return res.status(500).send({
            status: "error",
            message: "No se ha podido seguir al usuario"
        });
    }
}

// Accion de borrar un follow (accion dejar de seguir)
const unfollow = async (req, res) => {
    try {
        // Recoger el id del usuario identificado
        const userId = req.user.id;

        // Recoger el id del usuario que sigo y quiero dejar de seguir
        const followedId = req.params.id;

        // Buscar y eliminar el follow
        const followDeleted = await Follow.findOneAndDelete({
            user: userId,
            followed: followedId
        });

        if (!followDeleted) {
            return res.status(400).send({
                status: "error",
                message: "No sigues a este usuario"
            });
        }

        return res.status(200).send({
            status: "success",
            message: "Follow eliminado correctamente"
        });

    } catch (error) {
        console.error(error);
        return res.status(500).send({
            status: "error",
            message: "Error al dejar de seguir al usuario"
        });
    }
}

// Acción listado de usuarios que cualquier usuario está siguiendo (siguiendo)
const following = async (req, res) => {
    try {
        // Sacar el id del usuario identificado
        let userId = req.user.id;

        // Comprobar si me llega el id por paramatro en url
        if (req.params.id) userId = req.params.id;

        // Comprobar si me llega la pagina, si no la pagina 1
        let page = parseInt(req.params.page) || 1;

        // Usuarios por pagina quiero mostrar
        const itemsPerPage = 5;

        // Calcular el skip para paginación
        const skip = (page - 1) * itemsPerPage;

        // Find a follow, popular datos de los usuario y paginar
        const follows = await Follow.find({ user: userId })
            .populate("user followed", "-password -role -__v -email")
            .skip(skip)
            .limit(itemsPerPage)
            .sort("-_id");

        const total = await Follow.countDocuments({ user: userId });

        // Sacar un array de ids de los usuarios que me siguen y los que sigo
        let followUserIds = await followService.followUserIds(req.user.id);

        return res.status(200).send({
            status: "success",
            message: "Listado de usuarios que estoy siguiendo",
            follows,
            total,
            page,
            pages: Math.ceil(total / itemsPerPage),
            user_following: followUserIds.following,
            user_follow_me: followUserIds.followers
        });

    } catch (error) {
        console.error(error);
        return res.status(500).send({
            status: "error",
            message: "Error al obtener la lista de seguidos"
        });
    }
}


// Exportar acciones
module.exports = {
    save,
    unfollow,
    following
}