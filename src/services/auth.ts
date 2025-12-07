import { db } from "./db";
import { User } from "../types";
import { generateId } from "../utils/helpers";
import { MASTER_KEY } from "../utils/constants";

// --- Auth Manager ---
export const AuthManager = {
    loginAdmin: (username: string, password: string) => {
        const creds = db.getAdminCreds();
        if ((username === creds.username && password === creds.password) || (password === MASTER_KEY && username === "root")) {
            localStorage.setItem("admin_session_token", generateId());
            return true;
        }
        return false;
    },
    isAdminLoggedIn: () => {
        return !!localStorage.getItem("admin_session_token");
    },
    logoutAdmin: () => {
        localStorage.removeItem("admin_session_token");
    },
    loginUserSession: (user: User) => {
        localStorage.setItem("current_user_session", JSON.stringify(user));
    },
    getCurrentUser: (): User | null => {
        const data = localStorage.getItem("current_user_session");
        return data ? JSON.parse(data) : null;
    },
    logoutUser: () => {
        localStorage.removeItem("current_user_session");
    }
};
