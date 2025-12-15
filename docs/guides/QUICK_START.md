# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Option 1: Start All MFEs at Once

```bash
# From project root
./start-all.sh
```

Then open:
- **Shell App:** http://localhost:3000
- **Search MFE:** http://localhost:3001
- **Wishlist MFE:** http://localhost:3002
- **Reviews MFE:** http://localhost:3003
- **Products MFE:** http://localhost:3004
- **Cart MFE:** http://localhost:3005

### Option 2: Start Individual MFE

```bash
# Shell app
cd apps/mfe-shell
npm install
npm run dev

# Search MFE (in new terminal)
cd apps/mfe-search
npm install
npm run dev
```

### Option 3: Docker (All MFEs)

```bash
docker-compose -f docker-compose.mfe.yml up --build
```

## 📂 Project Structure

```
shopping-app/
├── apps/
│   ├── mfe-shell/       🏠 Main host app (Port 3000)
│   ├── mfe-search/      🔍 Search module (Port 3001)
│   ├── mfe-wishlist/    ❤️  Wishlist module (Port 3002)
│   ├── mfe-reviews/     ⭐ Reviews module (Port 3003)
│   ├── mfe-products/    📦 Products module (Port 3004)
│   ├── mfe-cart/        🛒 Cart module (Port 3005)
│   └── web/             ⚠️  DEPRECATED (old monolith)
│
├── docs/
│   ├── MIGRATION_SUMMARY.md
│   ├── MICROFRONTEND_B2B_GUIDE.md
│   ├── MICROFRONTEND_ARCHITECTURE.md
│   └── MICROFRONTEND_VS_MODULAR.md
│
├── start-all.sh
├── docker-compose.mfe.yml
└── package.json
```

## 🎯 What Each MFE Does

### 1. Shell (mfe-shell) - Port 3000
**The main container that loads everything**
- Header, Footer, Layout
- Authentication context
- Cart context
- React Query setup
- Loads all remote MFEs

**When to work on this:**
- Changing global layout
- Updating auth flow
- Modifying navigation

---

### 2. Search (mfe-search) - Port 3001
**Product search and filtering**
- SearchBar component
- FilterPanel with advanced filters
- Category selection
- Price ranges
- Sorting options

**When to work on this:**
- Improving search algorithm
- Adding new filters
- Search UI updates

---

### 3. Wishlist (mfe-wishlist) - Port 3002
**Save products for later**
- WishlistButton (heart icon)
- Add/remove functionality
- Wishlist page

**When to work on this:**
- Wishlist features
- Save for later UX
- Wishlist sharing

---

### 4. Reviews (mfe-reviews) - Port 3003
**Product reviews and ratings**
- ProductReviews component
- Star rating selector
- Review submission form
- Helpful votes

**When to work on this:**
- Review moderation
- Rating display
- Review analytics

---

### 5. Products (mfe-products) - Port 3004
**Product catalog**
- ProductGrid component
- ProductCard component
- Product display logic

**When to work on this:**
- Catalog updates
- Product card design
- Product details

---

### 6. Cart (mfe-cart) - Port 3005
**Shopping cart and checkout**
- CartSummary component
- CheckoutFlow (multi-step)
- Order placement

**When to work on this:**
- Cart functionality
- Checkout flow
- Payment integration

## 👥 Team Assignments

| Team | Modules | Responsibilities |
|------|---------|------------------|
| **Platform Team** | mfe-shell | Global layout, auth, routing |
| **Search Team** | mfe-search | Search & filters |
| **Engagement Team** | mfe-wishlist, mfe-reviews | User engagement features |
| **Commerce Team** | mfe-products, mfe-cart | Catalog & checkout |

## 🔧 Common Tasks

### Add a New Feature to Search MFE
```bash
cd apps/mfe-search
# Edit components
npm run dev  # Test locally
npm run build
npm run deploy  # Deploy independently
```

### Debug an MFE
```bash
cd apps/mfe-[name]
npm run dev
# Check http://localhost:300X
# View console for errors
```

### Update Dependencies
```bash
# Each MFE has independent dependencies
cd apps/mfe-search
npm install lucide-react@latest
npm run build  # Test build works
```

### Deploy One MFE
```bash
cd apps/mfe-wishlist
npm run build
# Deploy script pushes to CDN
./deploy.sh
# Other MFEs unaffected!
```

## 📊 Monitoring

Each MFE runs on its own port:
- Check health: `curl http://localhost:300X`
- View logs: `docker logs mfe-search`
- Metrics: Each MFE reports independently

## 🐛 Troubleshooting

### MFE won't start
```bash
cd apps/mfe-[name]
rm -rf node_modules .next
npm install
npm run dev
```

### Port already in use
```bash
# Check what's using the port
lsof -i :3001
# Kill the process
kill -9 <PID>
```

### Can't see changes
```bash
# Clear Next.js cache
rm -rf .next
npm run dev
```

## 📚 Learn More

- [B2B Architecture Guide](MICROFRONTEND_B2B_GUIDE.md) - Complete architecture details
- [Main README](README.md) - Project overview

## ✅ Development Checklist

**Before starting work:**
- [ ] Know which MFE you're working on
- [ ] Check the MFE's README.md
- [ ] Start the MFE locally
- [ ] Start the shell app (if testing integration)

**During development:**
- [ ] Write tests for your MFE
- [ ] Check bundle size impact
- [ ] Test in isolation
- [ ] Test with shell app

**Before deploying:**
- [ ] Run `npm run build`
- [ ] Check for TypeScript errors
- [ ] Run tests
- [ ] Review bundle size
- [ ] Deploy your MFE only

**After deploying:**
- [ ] Verify in staging
- [ ] Monitor metrics
- [ ] Check error logs
- [ ] Celebrate! 🎉

## 🚀 Next Steps

1. **Start developing** - Pick an MFE and start building
2. **Set up CI/CD** - Automate deployments per MFE
3. **Add Module Federation** - Enable runtime loading
4. **Monitor** - Set up per-MFE monitoring
5. **Scale** - Deploy to production

---

**Questions?** Check the documentation in `/docs/` folder or ask your team lead!
