import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../config/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { actionItems as mockActionItems } from '../data/mockPortfolio';

export function useActionCards(portfolioContext) {
  const { currentUser } = useAuth();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);

  const portfolioSummary = portfolioContext || {};

  const fetchOrGenerateCards = useCallback(async (forceRefresh = false) => {
    if (!currentUser) return;
    setLoading(true);

    if (currentUser.isDemo) {
      if (portfolioSummary?.actionItems && portfolioSummary.actionItems.length > 0) {
        setCards(portfolioSummary.actionItems);
      } else {
        setCards(mockActionItems || []);
      }
      setLoading(false);
      return;
    }

    try {
      const docRef = doc(db, 'investors', currentUser.uid);
      const docSnap = await getDoc(docRef);
      
      let needsNewCards = forceRefresh;
      let existingCards = [];
      let dismissedIds = [];

      if (docSnap.exists()) {
        const data = docSnap.data();
        existingCards = data.actionCards || [];
        dismissedIds = data.dismissedActionCards || [];
        
        const generatedAt = data.actionCardsGeneratedAt?.toDate();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        if (!existingCards.length || !generatedAt || generatedAt < sevenDaysAgo) {
          needsNewCards = true;
        }
      } else {
        needsNewCards = true;
      }

      if (needsNewCards) {
        const daysToFYEnd = Math.ceil((new Date(new Date().getFullYear() + (new Date().getMonth() >= 3 ? 1 : 0), 2, 31) - new Date()) / (1000 * 60 * 60 * 24));
        
        const prompt = `You are FinAgent AI analyzing an Indian investor's portfolio. Generate exactly 5 personalized action cards.

Portfolio Summary:
${JSON.stringify(portfolioSummary, null, 2)}

Current Date: ${new Date().toLocaleDateString('en-IN')}
Days until FY end (March 31): ${daysToFYEnd}

Return a JSON array of exactly 5 objects with this shape:
[
  {
    "id": "ac1",
    "priority": "high" | "medium" | "low",
    "icon": "<emoji>",
    "title": "short action title",
    "body": "2-sentence explanation with specific ₹ amounts from their portfolio",
    "potentialGain": number | null,
    "prompt": "the question the user should ask the AI about this",
    "category": "tax" | "insurance" | "goals" | "rebalancing" | "savings" | "fd_maturity"
  }
]
Return ONLY valid JSON array.`;

        const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
        const res = await fetch(`${API_BASE}/api/ai/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt })
        });
        
        const generatedCards = await res.json();
        
        await setDoc(docRef, {
          actionCards: generatedCards,
          actionCardsGeneratedAt: new Date(),
          dismissedActionCards: []
        }, { merge: true });
        
        setCards(generatedCards);
      } else {
        setCards(existingCards.filter(c => !dismissedIds.includes(c.id)));
      }
    } catch (err) {
      console.error("Failed to fetch/generate action cards:", err);
      setCards(portfolioSummary?.actionItems || mockActionItems || []);
    } finally {
      setLoading(false);
    }
  }, [currentUser, portfolioSummary]);

  useEffect(() => {
    fetchOrGenerateCards();
  }, [fetchOrGenerateCards]);

  const refresh = () => fetchOrGenerateCards(true);

  const dismiss = async (id) => {
    setCards(prev => prev.filter(c => c.id !== id));
    if (currentUser && !currentUser.isDemo) {
      const docRef = doc(db, 'investors', currentUser.uid);
      try {
        const docSnap = await getDoc(docRef);
        const data = docSnap.exists() ? docSnap.data() : {};
        const dismissed = data.dismissedActionCards || [];
        if (!dismissed.includes(id)) {
          await updateDoc(docRef, {
            dismissedActionCards: [...dismissed, id]
          });
        }
      } catch (err) {
        console.error("Failed to dismiss action card", err);
      }
    }
  };

  return { cards, loading, refresh, dismiss };
}
