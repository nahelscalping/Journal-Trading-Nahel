"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Settings, DollarSign, Download, Upload, Check, Copy,
  AlertTriangle, RefreshCw, User, Shield, Link2, Link2Off, Clock,
} from "lucide-react";
import {
  getSettings, saveSettings, exportAllData, importAllData,
  getCurrentCapital, getStats, UserSettings,
  enableAutoBackup, disableAutoBackup, getAutoBackup, refreshAutoBackup,
} from "@/lib/store";

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings>(getSettings());
  const [currentCapital, setCurrentCapital] = useState(0);
  const [stats, setStats] = useState(getStats());
  const [exportCode, setExportCode] = useState("");
  const [importCode, setImportCode] = useState("");
  const [importStatus, setImportStatus] = useState<"idle" | "success" | "error">("idle");
  const [copied, setCopied] = useState(false);
  const [backupCopied, setBackupCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [autoBackup, setAutoBackup] = useState<{ code: string; updatedAt: string } | null>(null);

  useEffect(() => {
    setCurrentCapital(getCurrentCapital());
    setStats(getStats());
    setSettings(getSettings());
    setAutoBackup(getAutoBackup());
  }, []);

  const handleSave = () => {
    saveSettings(settings);
    setCurrentCapital(getCurrentCapital());
    setStats(getStats());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleExport = () => {
    const code = exportAllData();
    setExportCode(code);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(exportCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyBackup = () => {
    if (!autoBackup) return;
    navigator.clipboard.writeText(autoBackup.code);
    setBackupCopied(true);
    setTimeout(() => setBackupCopied(false), 2000);
  };

  const handleImport = () => {
    if (!importCode.trim()) return;
    const success = importAllData(importCode);
    setImportStatus(success ? "success" : "error");
    if (success) {
      setSettings(getSettings());
      setCurrentCapital(getCurrentCapital());
      setStats(getStats());
      setAutoBackup(getAutoBackup());
      setImportCode("");
    }
    setTimeout(() => setImportStatus("idle"), 3000);
  };

  const handleDisableSync = () => {
    disableAutoBackup();
    setSettings(getSettings());
    setAutoBackup(null);
  };

  const handleRefreshBackup = () => {
    refreshAutoBackup();
    setAutoBackup(getAutoBackup());
  };

  const formatBackupTime = (iso: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="space-y-4 md:space-y-0">
      <motion.h1
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="text-xl md:text-3xl font-bold mb-1"
      >
        Paramètres
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-text-muted text-xs md:text-sm mb-4 md:mb-8"
      >
        Configuration de votre compte et synchronisation
      </motion.p>

      {/* Sync status banner */}
      {settings.autoBackupEnabled && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-3 md:p-4 mb-4 flex items-center justify-between gap-3 border border-accent-green/25"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-accent-green/15 flex items-center justify-center shrink-0">
              <Link2 size={16} className="text-accent-green" />
            </div>
            <div>
              <p className="text-xs font-semibold text-accent-green">Sauvegarde automatique active</p>
              {autoBackup && (
                <p className="text-[10px] text-text-muted flex items-center gap-1 mt-0.5">
                  <Clock size={9} /> Mis à jour le {formatBackupTime(autoBackup.updatedAt)}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopyBackup}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-btn-primary text-xs font-medium"
            >
              {backupCopied ? <Check size={13} /> : <Copy size={13} />}
              {backupCopied ? "Copié !" : "Copier"}
            </button>
            <button
              onClick={handleRefreshBackup}
              className="p-1.5 rounded-xl glass-btn text-text-muted"
              title="Rafraîchir"
            >
              <RefreshCw size={14} />
            </button>
            <button
              onClick={handleDisableSync}
              className="p-1.5 rounded-xl glass-btn text-text-muted hover:text-accent-red transition-colors"
              title="Désactiver"
            >
              <Link2Off size={14} />
            </button>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Profile & Capital */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-card p-4 md:p-6 space-y-4 md:space-y-6"
        >
          <h2 className="text-base font-semibold flex items-center gap-2">
            <User size={18} className="text-primary" />
            Profil & Capital
          </h2>

          <div>
            <label className="text-xs text-text-muted mb-1.5 block uppercase tracking-wider">
              Nom d&apos;affichage
            </label>
            <input
              type="text"
              value={settings.displayName}
              onChange={(e) => setSettings({ ...settings, displayName: e.target.value })}
              placeholder="Nahel"
              className="glass-input w-full px-4 py-3 text-sm"
            />
          </div>

          <div>
            <label className="text-xs text-text-muted mb-1.5 block uppercase tracking-wider">
              Capital de départ ($)
            </label>
            <input
              type="number"
              step="any"
              value={settings.startingCapital || ""}
              onChange={(e) => setSettings({ ...settings, startingCapital: parseFloat(e.target.value) || 0 })}
              placeholder="1000"
              className="glass-input w-full px-4 py-3 text-sm"
            />
            <p className="text-xs text-text-muted mt-2">
              Utilisé comme base pour le calcul du capital actuel.
            </p>
          </div>

          {/* Current capital display */}
          <div className="p-3 md:p-4 rounded-2xl bg-gradient-to-r from-primary/10 to-accent-green/10 border border-primary/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-text-muted uppercase tracking-wider">Capital actuel</span>
              <DollarSign size={14} className="text-primary" />
            </div>
            <p className={`text-xl md:text-2xl font-bold ${currentCapital >= settings.startingCapital ? "text-accent-green neon-green" : "text-accent-red neon-red"}`}>
              {currentCapital.toLocaleString("fr-FR")} $
            </p>
            <div className="flex items-center gap-3 mt-2">
              <span className={`text-xs font-medium ${stats.capitalGrowthPercent >= 0 ? "text-accent-green" : "text-accent-red"}`}>
                {stats.capitalGrowthPercent >= 0 ? "+" : ""}{stats.capitalGrowthPercent}%
              </span>
              <span className="text-xs text-text-muted">
                depuis {settings.startingCapital.toLocaleString("fr-FR")} $
              </span>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-2 md:gap-3">
            <div className="text-center p-2.5 md:p-3 rounded-xl glass-btn">
              <p className="text-base md:text-lg font-bold text-primary">{stats.totalTrades}</p>
              <p className="text-[9px] md:text-[10px] text-text-muted uppercase">Trades</p>
            </div>
            <div className="text-center p-2.5 md:p-3 rounded-xl glass-btn">
              <p className={`text-base md:text-lg font-bold ${stats.totalPnl >= 0 ? "text-accent-green" : "text-accent-red"}`}>
                {stats.totalPnl >= 0 ? "+" : ""}{stats.totalPnl.toFixed(0)} $
              </p>
              <p className="text-[9px] md:text-[10px] text-text-muted uppercase">PnL Total</p>
            </div>
            <div className="text-center p-2.5 md:p-3 rounded-xl glass-btn">
              <p className="text-base md:text-lg font-bold text-accent-green">{stats.winRate.toFixed(0)}%</p>
              <p className="text-[9px] md:text-[10px] text-text-muted uppercase">Win Rate</p>
            </div>
          </div>

          <button
            onClick={handleSave}
            className="w-full py-3 glass-btn-primary rounded-2xl font-medium transition-all flex items-center justify-center gap-2"
          >
            {saved ? <Check size={18} /> : <Settings size={18} />}
            {saved ? "Sauvegardé !" : "Sauvegarder"}
          </button>
        </motion.div>

        {/* Data Sync */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          {/* Export */}
          <div className="glass-card p-4 md:p-6 space-y-3 md:space-y-4">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <Upload size={18} className="text-accent-green" />
              Exporter mes données
            </h2>
            <p className="text-xs text-text-muted">
              Générez un code pour transférer vos données vers un autre appareil.
            </p>

            <button
              onClick={handleExport}
              className="w-full py-2.5 glass-btn rounded-2xl font-medium transition-all flex items-center justify-center gap-2 text-sm"
            >
              <RefreshCw size={16} />
              Générer le code de transfert
            </button>

            {exportCode && (
              <div className="space-y-2">
                <textarea
                  readOnly
                  value={exportCode}
                  className="w-full h-20 px-3 py-2.5 rounded-xl text-xs font-mono resize-none"
                  onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                />
                <button
                  onClick={handleCopy}
                  className="w-full py-2.5 glass-btn-primary rounded-2xl font-medium transition-all flex items-center justify-center gap-2 text-sm"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? "Copié !" : "Copier le code"}
                </button>
              </div>
            )}
          </div>

          {/* Import */}
          <div className="glass-card p-4 md:p-6 space-y-3 md:space-y-4">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <Download size={18} className="text-primary" />
              Importer des données
            </h2>
            <p className="text-xs text-text-muted">
              Collez le code de transfert d&apos;un autre appareil. La sauvegarde automatique s&apos;activera et vos données seront synchronisées à chaque trade.
            </p>

            <div className="flex items-center gap-2 p-3 rounded-xl bg-accent-yellow/10 border border-accent-yellow/20 text-accent-yellow text-xs">
              <AlertTriangle size={13} className="shrink-0" />
              <span>L&apos;importation remplacera toutes vos données actuelles.</span>
            </div>

            <textarea
              value={importCode}
              onChange={(e) => setImportCode(e.target.value)}
              placeholder="Collez votre code de transfert ici..."
              className="w-full h-20 px-3 py-2.5 rounded-xl text-xs font-mono resize-none"
            />

            <button
              onClick={handleImport}
              disabled={!importCode.trim()}
              className={`w-full py-3 rounded-2xl font-medium transition-all flex items-center justify-center gap-2 text-sm ${
                importCode.trim() ? "glass-btn-primary" : "glass-btn opacity-50 cursor-not-allowed"
              }`}
            >
              <Shield size={16} />
              Importer + Activer la sauvegarde auto
            </button>

            {importStatus === "success" && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-accent-green/10 border border-accent-green/20 text-accent-green text-sm">
                <Check size={16} />
                Données importées ! Sauvegarde auto activée.
              </div>
            )}
            {importStatus === "error" && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-accent-red/10 border border-accent-red/20 text-accent-red text-sm">
                <AlertTriangle size={16} />
                Code invalide. Vérifiez et réessayez.
              </div>
            )}

            {!settings.autoBackupEnabled && (
              <button
                onClick={() => { enableAutoBackup(); setSettings(getSettings()); setAutoBackup(getAutoBackup()); }}
                className="w-full py-2.5 glass-btn rounded-2xl font-medium transition-all flex items-center justify-center gap-2 text-sm text-accent-green"
              >
                <Link2 size={16} />
                Activer la sauvegarde auto sans importer
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
