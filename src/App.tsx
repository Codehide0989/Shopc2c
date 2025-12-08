import React, { useState, useEffect } from "react";
import { User, Product, Category, AppSettings } from "./types";
import { db } from "./services/db";
import { AuthManager } from "./services/auth";
import { useSecurity } from "./hooks/useSecurity";

import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Home from "./pages/Home";
import ProductDetail from "./pages/ProductDetail";
import Payment from "./pages/Payment";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";
import StaffDashboard from "./pages/StaffDashboard";
import CommunityChat from "./components/CommunityChat";
import CommunityForum from "./pages/CommunityForum";
import CreateForumPost from "./pages/CreateForumPost";
import ForumPostDetail from "./pages/ForumPostDetail";
import GlobalChat from "./pages/GlobalChat";
import C2CIdeList from "./pages/C2CIdeList";
import C2CIdeView from "./pages/C2CIdeView";

// ... (existing code)

const App = () => {
    useSecurity();
    const [view, setView] = useState("home");
    const [user, setUser] = useState<User | null>(AuthManager.getCurrentUser());
    const [isAdmin, setIsAdmin] = useState(AuthManager.isAdminLoggedIn());
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [settings, setSettings] = useState<AppSettings>({
        discordLink: "",
        storeName: "Shopc2c",
        heroImage: "",
        maintenanceMode: false,
        chatEnabled: true,
        communityLink: "",
        forumCreationEnabled: true,
        allowedDomains: []
    });
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
    const [selectedIdeId, setSelectedIdeId] = useState<string | null>(null);

    const loadData = async () => {
        const [s, p, c] = await Promise.all([
            db.getSettings(),
            db.getProducts(),
            db.getCategories()
        ]);
        setSettings(s);
        setProducts(p);
        setCategories(c);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleUserLogin = (u: User) => {
        AuthManager.loginUserSession(u);
        setUser(u);
        setView("home");
    };

    const handleAdminLogin = () => {
        setIsAdmin(true);
        setView("admin");
    };

    const handleLogout = () => {
        AuthManager.logoutUser();
        AuthManager.logoutAdmin();
        setUser(null);
        setIsAdmin(false);
        setView("login");
    };

    const handleAdminLogout = () => {
        AuthManager.logoutAdmin();
        setIsAdmin(false);
        setView("login");
    };

    const handlePurchase = (product: Product) => {
        if (!user) {
            setView("login");
            return;
        }
        setSelectedProduct(product);
        setView("payment");
    };

    const renderView = () => {
        if (view === "admin" && isAdmin) return <AdminDashboard user={user} onLogout={handleAdminLogout} onBackToStore={() => {
            setView("home");
            loadData(); // Refresh settings when coming back from admin panel
        }} />;
        if (view === "staff" && user?.role === 'staff') return <StaffDashboard user={user} onLogout={handleLogout} onBackToStore={() => setView("home")} />;
        if (view === "admin") return <Login onUserLogin={handleUserLogin} onAdminLogin={handleAdminLogin} onSwitch={() => setView("signup")} maintenanceMode={settings.maintenanceMode} />;



        if (view === "login") return <Login onUserLogin={handleUserLogin} onAdminLogin={handleAdminLogin} onSwitch={() => setView("signup")} maintenanceMode={settings.maintenanceMode} />;
        if (view === "signup") return <Signup onLogin={handleUserLogin} onSwitch={() => setView("login")} />;

        if (view === "product" && selectedProduct) return <ProductDetail product={selectedProduct} user={user} onBack={() => setView("home")} onPurchase={() => handlePurchase(selectedProduct)} />;

        if (view === "payment" && selectedProduct && user) return <Payment product={selectedProduct} user={user} onCancel={() => setView("product")} />;

        if (view === "c2c-ide-view" && selectedIdeId) {
            return <C2CIdeView ideId={selectedIdeId} onBack={() => setView("c2c-ide")} />;
        }

        if (settings.maintenanceMode && !isAdmin) {
            return <Login onUserLogin={handleUserLogin} onAdminLogin={handleAdminLogin} onSwitch={() => setView("signup")} maintenanceMode={true} />;
        }

        return (
            <>
                <Navbar onNavigate={setView} activeView={view} isAdmin={isAdmin} user={user} onLogoutUser={handleLogout} settings={settings} />
                {view === "home" && (
                    <Home
                        products={products}
                        categories={categories}
                        onProductClick={(p) => { setSelectedProduct(p); setView("product"); }}
                    />
                )}
                {view === "about" && <About />}
                {view === "contact" && <Contact />}
                {view === "community" && <CommunityForum user={user} settings={settings} onNavigate={(v, id) => {
                    if (id) setSelectedPostId(id);
                    setView(v);
                }} onLogout={handleLogout} />}
                {view === "community-create" && <CreateForumPost onNavigate={setView} user={user} settings={settings} />}
                {view === "community-post" && selectedPostId && <ForumPostDetail postId={selectedPostId} onNavigate={setView} user={user} />}
                {view === "profile" && user && <Profile user={user} />}
                {view === "chat" && <GlobalChat user={user || (isAdmin ? { userId: 'admin', username: 'Administrator', email: 'admin@shopc2c.io', isBanned: false, createdAt: 0, _id: 'admin', password: '' } : null)} onLogout={handleLogout} />}
                {view === "c2c-ide" && <C2CIdeList onNavigate={(v, id) => {
                    if (id) setSelectedIdeId(id);
                    setView(v);
                }} />}
            </>
        );
    };

    return (
        <div className="bg-gray-950 min-h-screen font-sans selection:bg-violet-500/30">
            {renderView()}
            {user && !isAdmin && view !== "chat" && view !== "c2c-ide-view" && <CommunityChat user={user} />}
        </div>
    );
};

export default App;
