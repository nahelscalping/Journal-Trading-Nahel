"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Edit3, X, ClipboardList, Clock, Zap, FileText } from "lucide-react";
import { getPlans, savePlan, deletePlan, generateId, TradingPlan } from "@/lib/store";

const defaultPlan: Omit<TradingPlan, "id" | "createdAt" | "updatedAt"> = {
  name: "",
  strategy: "",
  tradingHours: "",
  preferredSessions: "",
  description: "",
};

export default function PlansPage() {
  const [plans, setPlans] = useState<TradingPlan[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<TradingPlan | null>(null);
  const [form, setForm] = useState(defaultPlan);
  const [selectedPlan, setSelectedPlan] = useState<TradingPlan | null>(null);

  useEffect(() => {
    setPlans(getPlans());
  }, []);

  const handleSubmit = () => {
    if (!form.name) return;
    const now = new Date().toISOString();
    const plan: TradingPlan = {
      ...form,
      id: editingPlan?.id || generateId(),
      createdAt: editingPlan?.createdAt || now,
      updatedAt: now,
    };
    savePlan(plan);
    setPlans(getPlans());
    setShowForm(false);
    setEditingPlan(null);
    setForm(defaultPlan);
  };

  const handleEdit = (plan: TradingPlan) => {
    setEditingPlan(plan);
    setForm(plan);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    deletePlan(id);
    setPlans(getPlans());
    if (selectedPlan?.id === id) setSelectedPlan(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3 md:mb-6">
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-xl md:text-3xl font-bold"
        >
          Plans de Trading
        </motion.h1>
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setForm(defaultPlan);
            setEditingPlan(null);
            setShowForm(true);
          }}
          className="flex items-center gap-1.5 md:gap-2 px-3 md:px-5 py-2 md:py-2.5 glass-btn-primary rounded-2xl font-medium transition-all text-xs md:text-sm"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Créer un plan</span>
          <span className="sm:hidden">Créer</span>
        </motion.button>
      </div>

      {/* Modal Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">
                  {editingPlan ? "Modifier le plan" : "Nouveau Plan de Trading"}
                </h2>
                <button onClick={() => setShowForm(false)} className="text-text-muted hover:text-foreground">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-text-muted mb-1 block">Nom du plan</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Mon plan SMC Crypto"
                    className="w-full px-4 py-3 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="text-sm text-text-muted mb-1 flex items-center gap-2">
                    <Zap size={14} className="text-primary" />
                    Ma stratégie
                  </label>
                  <textarea
                    value={form.strategy}
                    onChange={(e) => setForm({ ...form, strategy: e.target.value })}
                    placeholder="Décrivez votre stratégie (ex: SMC, ICT, Price Action, Elliott Wave...)"
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl text-sm resize-none"
                  />
                </div>

                <div>
                  <label className="text-sm text-text-muted mb-1 flex items-center gap-2">
                    <Clock size={14} className="text-primary" />
                    Mes horaires de trading
                  </label>
                  <input
                    type="text"
                    value={form.tradingHours}
                    onChange={(e) => setForm({ ...form, tradingHours: e.target.value })}
                    placeholder="Ex: 14h-22h (session US)"
                    className="w-full px-4 py-3 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="text-sm text-text-muted mb-1 block">Sessions préférées</label>
                  <input
                    type="text"
                    value={form.preferredSessions}
                    onChange={(e) => setForm({ ...form, preferredSessions: e.target.value })}
                    placeholder="Ex: Session US, London Kill Zone, Asian Session"
                    className="w-full px-4 py-3 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="text-sm text-text-muted mb-1 flex items-center gap-2">
                    <FileText size={14} className="text-primary" />
                    Comment je trade
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Expliquez votre approche, vos règles d'entrée/sortie, votre gestion du risque..."
                    rows={5}
                    className="w-full px-4 py-3 rounded-xl text-sm resize-none"
                  />
                </div>

                <button
                  onClick={handleSubmit}
                  className="w-full py-3 glass-btn-primary rounded-2xl font-medium transition-all"
                >
                  {editingPlan ? "Modifier" : "Créer le plan"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {plans.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-32 text-text-muted"
        >
          <ClipboardList size={56} className="mb-4 opacity-30" />
          <p className="text-lg font-medium">Aucun plan de trading</p>
          <p className="text-sm mt-1">Créez votre premier plan pour organiser vos stratégies</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`glass-card p-6 cursor-pointer transition-all ${
                selectedPlan?.id === plan.id ? "border-primary/50 ring-1 ring-primary/20" : ""
              }`}
              onClick={() => setSelectedPlan(selectedPlan?.id === plan.id ? null : plan)}
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <div className="flex gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleEdit(plan); }}
                    className="p-1.5 rounded-lg hover:bg-surface-lighter text-text-muted hover:text-primary transition-colors"
                  >
                    <Edit3 size={15} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(plan.id); }}
                    className="p-1.5 rounded-lg hover:bg-surface-lighter text-text-muted hover:text-accent-red transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {plan.strategy && (
                  <div className="flex items-start gap-2">
                    <Zap size={14} className="text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-text-muted">Stratégie</p>
                      <p className="text-sm">{plan.strategy}</p>
                    </div>
                  </div>
                )}
                {plan.tradingHours && (
                  <div className="flex items-start gap-2">
                    <Clock size={14} className="text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-text-muted">Horaires</p>
                      <p className="text-sm">{plan.tradingHours}</p>
                    </div>
                  </div>
                )}
                {plan.preferredSessions && (
                  <div className="flex items-start gap-2">
                    <FileText size={14} className="text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-text-muted">Sessions</p>
                      <p className="text-sm">{plan.preferredSessions}</p>
                    </div>
                  </div>
                )}
              </div>

              <AnimatePresence>
                {selectedPlan?.id === plan.id && plan.description && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="text-xs text-text-muted mb-1">Comment je trade</p>
                      <p className="text-sm whitespace-pre-wrap">{plan.description}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
