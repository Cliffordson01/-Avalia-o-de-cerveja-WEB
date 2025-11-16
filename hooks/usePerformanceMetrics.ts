// hooks/usePerformanceMetrics.ts
'use client'

import { useEffect } from 'react'
import { useReportWebVitals } from 'next/web-vitals'

export function usePerformanceMetrics() {
  useReportWebVitals((metric) => {
    // Enviar métricas para seu analytics
    console.log('Web Vitals:', metric)
    
    // Exemplo: enviar para Google Analytics
    // gtag('event', metric.name, {
    //   value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
    //   label: metric.id,
    //   custom_map: { dimension1: 'metric' }
    // });
  })

  useEffect(() => {
    // Medir tempo de carregamento da página de forma compatível
    if (typeof window !== 'undefined' && 'performance' in window) {
      const perf = window.performance;
      
      // Método mais compatível com TypeScript
      const navigationEntry = perf.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigationEntry) {
        const timingInfo = {
          // Tempo até DOM Content Loaded
          domContentLoaded: navigationEntry.domContentLoadedEventEnd - navigationEntry.fetchStart,
          // Tempo total de carregamento
          loadComplete: navigationEntry.loadEventEnd - navigationEntry.fetchStart,
          // Tempo até primeiro byte
          firstByte: navigationEntry.responseStart - navigationEntry.requestStart,
          // Dados da navegação
          redirectCount: navigationEntry.redirectCount,
          type: navigationEntry.type
        };

        console.log('Performance Timing:', timingInfo);
        
        // Enviar para analytics
        // gtag('event', 'performance_timing', timingInfo);
      }

      // Métricas de pintura
      const paintEntries = perf.getEntriesByType('paint');
      paintEntries.forEach((entry) => {
        console.log(`${entry.name}:`, entry.startTime);
      });

      // Métricas de recursos (opcional)
      const resourceEntries = perf.getEntriesByType('resource');
      const pageResources = resourceEntries.filter(entry => 
        entry.name.includes(window.location.origin)
      );
      
      console.log('Page Resources:', pageResources.length);
    }
  }, [])
}

// ✅ VERSÃO SIMPLIFICADA SE AINDA DER ERRO
export function useSimplePerformanceMetrics() {
  useReportWebVitals((metric) => {
    console.log('Web Vitals:', metric);
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Método mais simples e compatível
      window.addEventListener('load', () => {
        setTimeout(() => {
          const perf = window.performance;
          if (perf) {
            const navigation = perf.timing;
            const loadTime = navigation.loadEventEnd - navigation.navigationStart;
            const domReadyTime = navigation.domContentLoadedEventEnd - navigation.navigationStart;
            
            console.log('Load Time:', loadTime, 'ms');
            console.log('DOM Ready Time:', domReadyTime, 'ms');
          }
        }, 0);
      });
    }
  }, []);
}