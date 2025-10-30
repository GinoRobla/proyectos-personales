const express = require("express");
const router = express.Router();
const UserController = require("../controllers/user");
const { auth } = require("../middlewares/auth");
const multer = require("multer");

//configuración de multer para subir archivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "./uploads/avatars");
    },
    filename: (req, file, cb) => {
        cb(null, "avatar-" + Date.now()+ "-" + file.originalname);
    }
});

const upload = multer({ storage: storage });  

// definir rutas
router.post('/register', UserController.register);
router.post('/login', UserController.login);
router.get('/getProfile/:id', auth, UserController.getProfile);
router.get('/list/:page', auth, UserController.list);
router.put('/update/:id', auth, UserController.update);
router.post('/upload/:id', auth, upload.single('file0'), UserController.upload);
router.get('/getAvatar/:file', UserController.getAvatar);
router.get('/counters/:id', auth, UserController.counters);

module.exports = router;