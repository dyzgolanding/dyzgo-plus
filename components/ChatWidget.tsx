"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

// Declaramos las variables globales de Chatwoot para que TypeScript no se queje
declare global {
  interface Window {
    chatwootSettings: any;
    chatwootSDK: any;
    $chatwoot: any;
  }
}

export default function ChatWidget() {
  const [organizerId, setOrganizerId] = useState<string | null>(null);

  // 1. Obtenemos el usuario súper rápido desde la caché de Supabase
  useEffect(() => {
    const fetchUserFast = async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.user) {
        setOrganizerId(data.session.user.id);
      }
    };
    
    fetchUserFast();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        setOrganizerId(session.user.id);
      } else if (event === "SIGNED_OUT") {
        setOrganizerId(null);
        // Si cierra sesión, reseteamos el chat para que no queden datos del usuario anterior
        if (window.$chatwoot) {
          window.$chatwoot.reset();
        }
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // 2. Inyectamos Chatwoot al detectar el ID
  useEffect(() => {
    if (!organizerId) return;

    // Solo lo inyectamos si no existe ya
    if (!document.getElementById("chatwoot-script")) {
      window.chatwootSettings = { hideMessageBubble: false, position: 'right' };
      
      const script = document.createElement("script");
      script.id = "chatwoot-script";
      script.src = "https://app.chatwoot.com/packs/js/sdk.js";
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        window.chatwootSDK.run({
          websiteToken: 'DgPzmCfvjwUMaerh7gX3MRzW',
          baseUrl: 'https://app.chatwoot.com'
        });

        // Cuando Chatwoot carga, le pasamos la identidad del productor de forma segura
        window.addEventListener("chatwoot:ready", () => {
          window.$chatwoot.setUser(organizerId, {
            name: `Productor (${organizerId.substring(0, 6)})`, // Se verá en tu panel como Productor (f312a1...)
          });
          // Guardamos el ID como atributo para enviarlo a n8n
          window.$chatwoot.setCustomAttributes({
            organizer_id: organizerId
          });
        });
      };
      
      document.body.appendChild(script);
    } else if (window.$chatwoot) {
      // Si el script ya estaba, solo actualizamos los datos del usuario
      window.$chatwoot.setUser(organizerId, {
        name: `Productor (${organizerId.substring(0, 6)})`,
      });
      window.$chatwoot.setCustomAttributes({
        organizer_id: organizerId
      });
    }

  }, [organizerId]);

  return null;
}