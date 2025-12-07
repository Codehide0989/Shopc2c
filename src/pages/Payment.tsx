import React, { useState, useEffect } from "react";
import { Product, User, AppSettings } from "../types";
import { db } from "../services/db";
import { generateId } from "../utils/helpers";

interface PaymentProps {
    product: Product;
    user: User;
    onCancel: () => void;
}

const Payment: React.FC<PaymentProps> = ({ product, user, onCancel }) => {
    const [step, setStep] = useState(1);
    const [settings, setSettings] = useState<AppSettings | null>(null);

    useEffect(() => {
        db.getSettings().then(setSettings);
    }, []);

    // Steps configuration for dynamic rendering
    const steps = [
        { id: 1, title: "Identity", icon: "fa-id-card" },
        { id: 2, title: "Community", icon: "fa-brands fa-discord" },
        { id: 3, title: "Payment", icon: "fa-money-bill-transfer" },
        { id: 4, title: "Verification", icon: "fa-clock" }
    ];

    return (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="w-full max-w-2xl bg-[#09090b] rounded-[32px] border border-white/10 overflow-hidden shadow-2xl relative">
                {/* Decorative Elements */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600"></div>
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-violet-600/20 rounded-full blur-[100px] pointer-events-none"></div>
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-fuchsia-600/20 rounded-full blur-[100px] pointer-events-none"></div>

                <button
                    onClick={onCancel}
                    className="absolute top-6 right-6 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all z-20"
                >
                    <i className="fa-solid fa-xmark"></i>
                </button>

                <div className="p-8 md:p-10 relative z-10">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-display font-bold text-white mb-2 tracking-tight">Purchase Assets</h2>
                        <p className="text-gray-400">Complete the process to acquire <span className="text-violet-400 font-bold">{product.title}</span></p>
                    </div>

                    {/* Progress Steps */}
                    <div className="flex justify-between items-center mb-12 relative max-w-md mx-auto">
                        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-800 -z-10 rounded-full"></div>
                        <div
                            className="absolute top-1/2 left-0 h-0.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 -z-10 transition-all duration-500 rounded-full"
                            style={{ width: `${((step - 1) / 3) * 100}%` }}
                        ></div>
                        {steps.map((s) => (
                            <div key={s.id} className="relative group">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm transition-all duration-500 border-2 ${step >= s.id ? "bg-gray-900 border-violet-500 text-violet-400 shadow-[0_0_20px_rgba(139,92,246,0.3)] scale-110" : "bg-gray-900 border-gray-700 text-gray-600"}`}>
                                    <i className={`fa-solid ${s.icon}`}></i>
                                </div>
                                <div className={`absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] uppercase font-bold tracking-wider transition-colors duration-300 whitespace-nowrap ${step >= s.id ? "text-white" : "text-gray-600"}`}>
                                    {s.title}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="bg-white/5 p-8 rounded-3xl border border-white/5 mb-8 min-h-[300px] flex flex-col justify-center relative overflow-hidden">
                        {/* Step 1: Identity */}
                        {step === 1 && (
                            <div className="text-center animate-in fade-in slide-in-from-right-8 duration-500">
                                <div className="w-20 h-20 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl rotate-3">
                                    <i className="fa-regular fa-id-card text-4xl text-violet-400"></i>
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-3">Your Unique ID</h3>
                                <p className="text-gray-400 text-sm mb-8 max-w-sm mx-auto leading-relaxed">
                                    This ID links your payment to your account. Please copy it before proceeding.
                                </p>

                                <button
                                    onClick={() => { navigator.clipboard.writeText(user.userId); setStep(2); }}
                                    className="bg-gray-800 hover:bg-gray-700 text-white border border-gray-600 hover:border-violet-500 px-8 py-4 rounded-xl font-mono text-lg transition-all flex items-center gap-4 mx-auto group hover:scale-105 hover:shadow-xl"
                                >
                                    <span className="text-violet-300">{user.userId}</span>
                                    <i className="fa-regular fa-copy text-gray-500 group-hover:text-white transition-colors"></i>
                                </button>
                                <p className="mt-4 text-xs text-gray-500">Click to copy & continue</p>
                            </div>
                        )}

                        {/* Step 2: Community */}
                        {step === 2 && (
                            <div className="text-center animate-in fade-in slide-in-from-right-8 duration-500">
                                <div className="w-20 h-20 bg-[#5865F2] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl -rotate-3">
                                    <i className="fa-brands fa-discord text-4xl text-white"></i>
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-3">Join Our Community</h3>
                                <p className="text-gray-400 text-sm mb-8 max-w-sm mx-auto leading-relaxed">
                                    Our automated bot handles payments securely via Discord. Join now to proceed.
                                </p>

                                <button
                                    onClick={() => {
                                        if (settings?.discordLink) window.open(settings.discordLink, "_blank");
                                        setStep(3);
                                    }}
                                    className="bg-[#5865F2] hover:bg-[#4752c4] text-white px-10 py-4 rounded-xl font-bold transition-all shadow-lg hover:shadow-[#5865F2]/30 flex items-center gap-3 mx-auto hover:scale-105"
                                >
                                    Open Discord <i className="fa-solid fa-arrow-up-right-from-square"></i>
                                </button>
                            </div>
                        )}

                        {/* Step 3: Payment */}
                        {step === 3 && (
                            <div className="text-center animate-in fade-in slide-in-from-right-8 duration-500">
                                <div className="w-20 h-20 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl border border-emerald-500/20">
                                    <i className="fa-solid fa-money-bill-transfer text-4xl text-emerald-400"></i>
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-3">Transfer Amount</h3>
                                <div className="bg-black/30 p-4 rounded-xl border border-white/5 max-w-sm mx-auto mb-6 text-left space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 text-xs uppercase font-bold">Amount</span>
                                        <span className="text-emerald-400 font-mono font-bold">{product.priceOwo.toLocaleString()} Owo</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 text-xs uppercase font-bold">Channel</span>
                                        <span className="text-white font-mono text-sm">#payments</span>
                                    </div>
                                    <div className="pt-2 border-t border-white/5">
                                        <span className="text-gray-500 text-xs uppercase font-bold block mb-1">Memo (Required)</span>
                                        <code className="block bg-gray-900 p-2.5 rounded text-xs text-violet-300 break-all select-all font-mono border border-gray-800">
                                            {user.userId} | {product.id}
                                        </code>
                                    </div>
                                </div>

                                <button
                                    onClick={async () => {
                                        const orderId = `ord_${generateId()}`;
                                        await db.createOrder({
                                            id: orderId,
                                            userId: user.userId,
                                            username: user.username,
                                            productId: product.id,
                                            productTitle: product.title,
                                            amount: product.priceOwo,
                                            currency: 'OWO',
                                            memo: `${user.userId} | ${product.id}`,
                                            status: 'pending',
                                            timestamp: Date.now()
                                        });
                                        setStep(4);
                                    }}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-10 py-4 rounded-xl font-bold transition-all shadow-lg hover:shadow-emerald-600/30 hover:scale-105 flex items-center gap-2 mx-auto"
                                >
                                    <i className="fa-solid fa-check"></i> I Have Transferred
                                </button>
                            </div>
                        )}

                        {/* Step 4: Verification */}
                        {step === 4 && (
                            <div className="text-center animate-in fade-in slide-in-from-right-8 duration-500">
                                <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl border border-blue-500/20 relative">
                                    <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full animate-[spin_8s_linear_infinite]"></div>
                                    <i className="fa-solid fa-hourglass-half text-4xl text-blue-400"></i>
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-3">Verification Pending</h3>
                                <p className="text-gray-400 text-sm mb-8 max-w-md mx-auto leading-relaxed">
                                    Thank you! Your transaction is being verified by our team. Access will be granted automatically upon confirmation.
                                </p>
                                <button onClick={onCancel} className="text-white hover:text-violet-400 font-bold transition-colors flex items-center gap-2 mx-auto">
                                    <i className="fa-solid fa-store"></i> Return to Store
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-between items-center text-xs text-gray-600 font-medium">
                        <button
                            onClick={() => setStep(Math.max(1, step - 1))}
                            disabled={step === 1 || step === 4}
                            className="hover:text-white disabled:opacity-0 transition-colors flex items-center gap-1"
                        >
                            <i className="fa-solid fa-arrow-left"></i> Previous Step
                        </button>
                        <span className="flex items-center gap-2"><i className="fa-solid fa-lock"></i> 256-bit Secure SSL</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Payment;
