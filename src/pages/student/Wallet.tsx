import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, ArrowUpRight, ArrowDownLeft, Wallet as WalletIcon, History } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

export default function Wallet() {
  const navigate = useNavigate();

  // Mock data for UI demonstration - connect to 'wallet_transactions' table later
  const transactions = [
    { id: 1, type: 'debit', amount: 2500, description: 'Order #ORD-2024-001', date: '2024-03-20 14:30', status: 'success' },
    { id: 2, type: 'credit', amount: 10000, description: 'Wallet Top-up', date: '2024-03-19 09:00', status: 'success' },
    { id: 3, type: 'debit', amount: 1200, description: 'Order #ORD-2024-002', date: '2024-03-18 12:15', status: 'success' },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-background border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/student/browse")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
        <h1 className="text-3xl font-bold">My Wallet</h1>

        {/* Balance Card */}
        <Card className="bg-primary text-primary-foreground border-none shadow-xl overflow-hidden relative">
          <div className="absolute right-0 top-0 h-32 w-32 bg-white/10 rounded-bl-full" />
          <CardContent className="p-8 space-y-6 relative z-10">
            <div className="flex items-center gap-2 opacity-90">
              <WalletIcon className="h-5 w-5" />
              <span className="font-medium">Available Balance</span>
            </div>
            <div>
              <h2 className="text-5xl font-bold tracking-tight">₦6,300.00</h2>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="secondary" className="font-semibold shadow-sm hover:bg-white/90">
                <Plus className="mr-2 h-4 w-4" /> Fund Wallet
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Transaction History */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <History className="h-5 w-5 text-muted-foreground" /> Recent Transactions
            </h3>
            <Button variant="link" className="text-sm">View All</Button>
          </div>

          <Card>
            <CardContent className="p-0">
              {transactions.map((tx, index) => (
                <div 
                  key={tx.id} 
                  className={`flex items-center justify-between p-4 ${index !== transactions.length - 1 ? 'border-b' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      tx.type === 'credit' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                    }`}>
                      {tx.type === 'credit' ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">{tx.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`font-bold ${tx.type === 'credit' ? 'text-green-600' : 'text-foreground'}`}>
                      {tx.type === 'credit' ? '+' : '-'}₦{tx.amount.toLocaleString()}
                    </span>
                    <div>
                       <Badge variant="outline" className="text-[10px] h-5 px-1 uppercase">{tx.status}</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}