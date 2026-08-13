#!/usr/bin/env bash
# scripts/verify.sh — Verificación completa: tipos + linter + tests
# Uso: ./scripts/verify.sh
# Todos los pasos deben pasar en verde antes de hacer merge a main.

set -e  # Salir al primer error

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo "╔═══════════════════════════════════════╗"
echo "║     Cerca App — Verificación CI       ║"
echo "╚═══════════════════════════════════════╝"
echo ""

# 1. TypeScript
echo -e "${YELLOW}[1/3] Verificando tipos TypeScript...${NC}"
npx tsc --noEmit
echo -e "${GREEN}  ✓ Sin errores de tipos${NC}"
echo ""

# 2. ESLint
echo -e "${YELLOW}[2/3] Ejecutando ESLint (arquitectura + calidad)...${NC}"
npx eslint . --max-warnings 0
echo -e "${GREEN}  ✓ Sin warnings ni errores de linting${NC}"
echo ""

# 3. Tests
echo -e "${YELLOW}[3/3] Ejecutando tests unitarios (Vitest)...${NC}"
npx vitest run
echo -e "${GREEN}  ✓ Todos los tests pasan${NC}"
echo ""

echo -e "${GREEN}╔═══════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   ✅ VERIFY EN VERDE — OK para merge   ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════╝${NC}"
echo ""
