import { Routes, Route, BrowserRouter, Link } from "react-router-dom";
import { PublicLayout } from "../components/layout/public/PublicLayout";
import { Login } from "../components/user/Login";
import { Register } from "../components/user/Register";
import { PrivateLayout } from "../components/layout/private/PrivateLayout";
import { Feed } from "../components/publication/Feed";
import { CreatePost } from "../components/publication/CreatePost";
import { AuthProvider } from "../context/AuthProvider";
import { Logout } from "../components/user/Logout";
import { Config } from "../components/user/Config";
import { Profile } from "../components/user/Profile";
import { UserList} from "../components/user/UserList";

export const Routing = () => {
  return (
    <BrowserRouter future={{
      v7_startTransition: true,
      v7_relativeSplatPath: true
    }}>

      <AuthProvider>

        <Routes>

            <Route path="/" element={<PublicLayout />}>
                <Route index element={<Login />}></Route>
                <Route path="login" element={<Login />}></Route>
                <Route path="registro" element={<Register />}></Route>
            </Route>

            <Route path="/social" element={<PrivateLayout />}>
                <Route index element={<Feed />} />
                <Route path="feed" element={<Feed />} />
                <Route path="crear" element={<CreatePost />} />
                <Route path="logout" element={<Logout />} />
                <Route path="usuarios" element={<UserList />} />
                <Route path="ajustes" element={<Config />} />
                <Route path="perfil/:userId" element={<Profile />} />
            </Route>

            <Route path="*" element={
              <>
                <div>
                  <h1>Error 404</h1>
                  <Link to="/">Volver al Inicio</Link>
                </div>
              </>
            } /> 


        </Routes>

      </AuthProvider>
    </BrowserRouter>
  )
}
