import React, { useEffect, useState } from 'react';
import { Mail, Clock, ShieldCheck, Key, ExternalLink, X, RefreshCw } from 'lucide-react';
import { EmailDispatchLog } from '../types';

interface EmailSimulatorModalProps {
  onClose: () => void;
  onOpenVerificationForm: (trustId: string, token?: string) => void;
}

export const EmailSimulatorModal: React.FC<EmailSimulatorModalProps> = ({
  onClose,
  onOpenVerificationForm,
}) => {
  const [emails, setEmails] = useState<EmailDispatchLog[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<EmailDispatchLog | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchEmails = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/simulation/emails');
      const data = await res.json();
      if (data.success) {
        setEmails(data.emails);
        if (data.emails.length > 0 && !selectedEmail) {
          setSelectedEmail(data.emails[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch emails:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-fadeIn">
        
        {/* Header */}
        <div className="bg-[#0C2340] text-white p-4 px-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Simulated Customer Inbox (Section 7 Two-Email Flow)</h2>
              <p className="text-xs text-slate-400">Email 1 (OTP Only, 20m expiry) &amp; Email 2 (Secure 3-Option Verification Link)</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={fetchEmails}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Refresh Inbox"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 flex-1 overflow-hidden">
          
          {/* Email List Column */}
          <div className="border-r border-slate-200 bg-slate-50/50 overflow-y-auto max-h-[70vh] p-3 space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
              Dispatched Messages ({emails.length})
            </div>
            {emails.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No emails dispatched yet. Trigger geofence delivery in the Simulation Panel.
              </div>
            ) : (
              emails.map((email) => {
                const isSelected = selectedEmail?.id === email.id;
                const isEmail1 = email.type === 'EMAIL_1_OTP';
                return (
                  <div
                    key={email.id}
                    onClick={() => setSelectedEmail(email)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition ${
                      isSelected
                        ? 'bg-blue-50 border-blue-400 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        isEmail1 ? 'bg-sky-100 text-sky-800' : 'bg-indigo-100 text-indigo-800'
                      }`}>
                        {isEmail1 ? 'Email 1 (OTP Only)' : 'Email 2 (Form Link)'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(email.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="font-semibold text-slate-900 mt-1.5 truncate">
                      {email.subject}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">
                      To: {email.recipient_email}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Email Reading Pane */}
          <div className="col-span-2 p-6 overflow-y-auto max-h-[70vh] space-y-4">
            {selectedEmail ? (
              <div className="space-y-4">
                <div className="border-b border-slate-200 pb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {selectedEmail.type}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(selectedEmail.timestamp).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-slate-900 mt-2">
                    {selectedEmail.subject}
                  </h3>
                  <div className="text-xs text-slate-500 mt-1 font-mono">
                    To: <span className="text-slate-800">{selectedEmail.recipient_email}</span> · User: <span className="text-slate-800">{selectedEmail.recipient_user_id}</span>
                  </div>
                </div>

                {/* Render HTML content safely */}
                <div
                  className="bg-slate-50/50 p-4 rounded-xl border border-slate-200 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: selectedEmail.body_html }}
                />

                {/* Action button if Email 2 */}
                {selectedEmail.type === 'EMAIL_2_VERIFICATION_LINK' && (
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => {
                        onClose();
                        onOpenVerificationForm(selectedEmail.trust_id);
                      }}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open Customer 3-Option Web Form Directly
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-20 text-center text-xs text-slate-400">
                Select an email from the left pane to view its rendered contents.
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
