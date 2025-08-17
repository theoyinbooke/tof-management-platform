"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function TestHydration() {
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState("Not clicked");

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">Hydration Test</h1>
      <p>If you can click the buttons and see changes, React is working properly.</p>
      
      <div className="space-y-4">
        <div>
          <p>Count: {count}</p>
          <Button onClick={() => setCount(count + 1)}>
            Increment Count
          </Button>
        </div>
        
        <div>
          <p>Message: {message}</p>
          <Button onClick={() => setMessage("Button clicked!")}>
            Change Message
          </Button>
        </div>
        
        <div>
          <Button onClick={() => alert("This should NOT show - no native alerts allowed!")}>
            Test Alert (Should not work)
          </Button>
        </div>
      </div>
    </div>
  );
}