import { useState, useEffect } from "react";
import { Global } from "../../helpers/Global";
import { formatDate } from "../../helpers/FormatDate";
import useAuth from "../../hooks/useAuth";

export const UserList = () => {
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [more, setMore] = useState(true);
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);
  const { auth } = useAuth();

  useEffect(() => {
    getUsers(1);
  }, []);

  const getUsers = async (nextPage = 1) => {
    setLoading(true);
    
    try {
      const request = await fetch(Global.url + "user/list/" + nextPage, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": localStorage.getItem("token")
        }
      });

      const data = await request.json();

      if (data.users && data.status === "success") {
        // Filtrar el usuario actual de la lista
        let filteredUsers = data.users.filter(user => 
          user._id !== (auth._id || auth.id)
        );

        let newUsers = filteredUsers;

        if (users.length >= 1) {
          // Evitar duplicados verificando IDs existentes
          const existingUserIds = users.map(user => user._id);
          const uniqueFilteredUsers = filteredUsers.filter(user => 
            !existingUserIds.includes(user._id)
          );
          newUsers = [...users, ...uniqueFilteredUsers];
        }

        setUsers(newUsers);
        setFollowing(data.user_following || []);
        setLoading(false);

        // Ajustar lógica para mostrar más usuarios
        // Si recibimos menos de 10 usuarios del backend O si ya tenemos todos los usuarios
        const totalUsersExpected = data.total - 1; // Restar 1 porque excluimos al usuario actual
        if (data.users.length < 10 || newUsers.length >= totalUsersExpected) {
          setMore(false);
        } else {
          setMore(true);
        }
      } else {
        console.error("Error getting users:", data);
        setLoading(false);
      }
    } catch (error) {
      console.error("Network error getting users:", error);
      setLoading(false);
    }
  };

  const nextPage = () => {
    let next = page + 1;
    setPage(next);
    getUsers(next);
  };

  const follow = async (userId) => {
    try {
      const request = await fetch(Global.url + "follow/save", {
        method: "POST",
        body: JSON.stringify({followed: userId}),
        headers: {
          "Content-Type": "application/json",
          "Authorization": localStorage.getItem("token")
        }
      });

      const data = await request.json();

      if (data.status === "success") {
        setFollowing([...following, userId]);
      }
    } catch (error) {
      console.error("Error following user:", error);
    }
  };

  const unfollow = async (userId) => {
    try {
      const request = await fetch(Global.url + "follow/unfollow/" + userId, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": localStorage.getItem("token")
        }
      });

      const data = await request.json();

      if (data.status === "success") {
        let filterFollowings = following.filter(followingUserId => userId !== followingUserId);
        setFollowing(filterFollowings);
      }
    } catch (error) {
      console.error("Error unfollowing user:", error);
    }
  };

  const sendMessage = (userId) => {
    alert("Funcionalidad de mensajes próximamente disponible");
  };

  const goToProfile = (userId) => {
    window.location.href = `/social/perfil/${userId}`;
  };

  if (loading && users.length === 0) {
    return (
      <div className="content__posts">
        <header className="content__header">
          <h1 className="content__title">
            <i className="fa-solid fa-users"></i>
            Usuarios
          </h1>
        </header>
        <div className="loading">Cargando usuarios...</div>
      </div>
    );
  }

  return (
    <div className="content__posts">
      <header className="content__header">
        <h1 className="content__title">
          <i className="fa-solid fa-users"></i>
          Usuarios
        </h1>
      </header>

      <div className="users-list">
        {users.length > 0 ? users.map(user => {
          return (
            <article className="user-card" key={user._id}>
              <div className="user-card__container">
                <div className="user-card__avatar" onClick={() => goToProfile(user._id)}>
                  {user.image && user.image !== "default.png" ? (
                    <img 
                      src={Global.url + "user/getAvatar/" + user.image} 
                      className="user-card__image" 
                      alt="Foto de perfil"
                      onError={(e) => {
                        e.target.src = "/src/assets/img/user.png";
                      }}
                    />
                  ) : (
                    <img 
                      src="/src/assets/img/user.png" 
                      className="user-card__image" 
                      alt="Foto de perfil" 
                    />
                  )}
                </div>

                <div className="user-card__info">
                  <div className="user-card__header">
                    <h3 
                      className="user-card__name"
                      onClick={() => goToProfile(user._id)}
                    >
                      {user.name} {user.surname}
                    </h3>
                    <span className="user-card__date">
                      Se unió {formatDate(user.created_at)}
                    </span>
                  </div>
                </div>

                <div className="user-card__actions">
                  <button 
                    className="user-btn user-btn--profile"
                    onClick={() => goToProfile(user._id)}
                    title="Ver perfil"
                  >
                    <i className="fa-solid fa-user"></i>
                    Ver Perfil
                  </button>
                </div>
              </div>
            </article>
          );
        }) : (
          <div className="empty-state">
            <div className="empty-state__content">
              <i className="fa-solid fa-users empty-state__icon"></i>
              <h3>No hay usuarios para mostrar</h3>
              <p>No se encontraron usuarios en este momento.</p>
            </div>
          </div>
        )}
      </div>

      {loading && users.length > 0 && (
        <div className="loading">Cargando más usuarios...</div>
      )}

      {more && !loading && (
        <div className="content__container-btn">
          <button className="content__btn-more-post" onClick={nextPage}>
            <i className="fa-solid fa-arrow-down"></i>
            Ver más usuarios
          </button>
        </div>
      )}
    </div>
  );
};