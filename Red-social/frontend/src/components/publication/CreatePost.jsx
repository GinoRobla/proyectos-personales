import { useState } from "react";
import { useForm } from "../../hooks/useForm";
import { Global } from "../../helpers/Global";
import useAuth from "../../hooks/useAuth";

export const CreatePost = () => {
  const { form, changed } = useForm({});
  const [stored, setStored] = useState("not_stored");
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const { auth } = useAuth();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => setFilePreview(e.target.result);
        reader.readAsDataURL(file);
      }
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    document.querySelector("#file").value = "";
  };

  const savePublication = async (e) => {
    e.preventDefault();

    let newPublication = form;
    newPublication.user = auth._id || auth.id;

    try {
      const request = await fetch(Global.url + "publication/save", {
        method: "POST",
        body: JSON.stringify(newPublication),
        headers: {
          "Content-Type": "application/json",
          "Authorization": localStorage.getItem("token")
        }
      });

      const data = await request.json();

      if (data.status === "success") {
        setStored("stored");
        
        const myForm = document.querySelector("#publication-form");
        myForm.reset();

        if (data.publication && selectedFile) {
          
          const formData = new FormData();
          formData.append("file0", selectedFile);

          const uploadRequest = await fetch(Global.url + "publication/upload/" + data.publication._id, {
            method: "POST",
            body: formData,
            headers: {
              "Authorization": localStorage.getItem("token")
            }
          });

          const uploadData = await uploadRequest.json();

          if (uploadData.status === "success") {
            setStored("stored");
          } else {
            console.error("❌ CreatePost: Error subiendo imagen:", uploadData.message);
            setStored("error");
          }
        }

        // Reset form and file
        setSelectedFile(null);
        setFilePreview(null);

        setTimeout(() => {
          setStored("not_stored");
        }, 5000);

      } else {
        console.error("❌ CreatePost: Error en respuesta save:", data.message);
        setStored("error");
      }
    } catch (error) {
      console.error("❌ CreatePost: Error de red/excepción:", error);
      setStored("error");
    }
  };

  return (
    <div className="create-post-page">
      <header className="content__header">
        <h1 className="content__title">
          <i className="fa-solid fa-plus"></i>
          Crear Publicación
        </h1>
      </header>

      <div className="create-post-container">
        <div className="create-post-card">
          <div className="create-post__header">
            <div className="create-post__avatar">
              {auth.image && auth.image !== "default.png" ? (
                <img 
                  src={Global.url + "user/getAvatar/" + auth.image} 
                  className="create-post__user-image" 
                  alt="Foto de perfil"
                  onError={(e) => {
                    e.target.src = "/src/assets/img/user.png";
                  }}
                />
              ) : (
                <img 
                  src="/src/assets/img/user.png" 
                  className="create-post__user-image" 
                  alt="Foto de perfil" 
                />
              )}
            </div>

            <div className="create-post__user-info">
              <h3 className="create-post__name">
                {auth.name} {auth.surname}
              </h3>
              <span className="create-post__date">Publicando ahora</span>
            </div>
          </div>

          <form id="publication-form" className="create-post__form" onSubmit={savePublication}>
            <div className="form-group">
              <textarea 
                name="text" 
                className="create-post__textarea" 
                placeholder="¿Qué estás pensando hoy?"
                onChange={changed}
                rows="4"
                required
              />
            </div>

            {filePreview && (
              <div className="file-preview">
                <div className="file-preview__container">
                  <img src={filePreview} alt="Preview" className="file-preview__image" />
                  <button 
                    type="button" 
                    className="file-preview__remove"
                    onClick={removeFile}
                  >
                    <i className="fa-solid fa-times"></i>
                  </button>
                </div>
              </div>
            )}

            <div className="create-post__actions">
              <div className="file-upload-section">
                <input 
                  type="file" 
                  name="file0" 
                  id="file" 
                  className="file-input"
                  accept="image/*"
                  onChange={handleFileChange}
                />
                <label htmlFor="file" className="file-upload-btn">
                  <i className="fa-solid fa-image"></i>
                  {selectedFile ? 'Cambiar imagen' : 'Subir imagen'}
                </label>
              </div>

              <button 
                type="submit" 
                className="create-post__submit"
                disabled={!form.text}
              >
                <i className="fa-solid fa-paper-plane"></i>
                Publicar
              </button>
            </div>

            <div className="alert-section">
              {stored === "stored" && (
                <div className="alert alert-success">
                  <i className="fa-solid fa-check-circle"></i>
                  ¡Publicación creada correctamente!
                </div>
              )}
              {stored === "error" && (
                <div className="alert alert-danger">
                  <i className="fa-solid fa-exclamation-circle"></i>
                  Error al crear la publicación. Inténtalo de nuevo.
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};