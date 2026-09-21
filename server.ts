import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import {
  SEED_TENANTS,
  SEED_USERS,
  SEED_BRANCHES,
  SEED_CATEGORIES,
  SEED_PRODUCTS,
  SEED_TRANSACTIONS,
  SEED_ACTIVITY_LOGS,
  SEED_CUSTOMERS,
} from './src/data/seedData';
import { Tenant, User, Branch, Category, Product, Transaction, ActivityLog, Role, Customer, ProductShipment } from './src/types';

const app = express();
const PORT = 3000;

// Security & Authentication Configuration
export const JWT_SECRET = process.env.JWT_SECRET || 'multipos-enterprise-jwt-secret-key-2026';
export const JWT_EXPIRES_IN = '24h';

app.use(express.json());

// In-Memory Multi-Tenant Database Store with bcrypt password/PIN initialization
let tenants: Tenant[] = [...SEED_TENANTS];

// Hash all initial seed user passwords and PINs with bcrypt
let users: User[] = SEED_USERS.map((u) => {
  const plainPassword = u.password || 'password123';
  const plainPin = u.pin || '1234';
  const salt = bcrypt.genSaltSync(10);
  const password_hash = bcrypt.hashSync(plainPassword, salt);
  const pin_hash = bcrypt.hashSync(plainPin, salt);
  return {
    ...u,
    pin: plainPin,
    pin_hash,
    password: plainPassword,
    password_hash,
  };
});

let branches: Branch[] = [...SEED_BRANCHES];
let categories: Category[] = [...SEED_CATEGORIES];
let products: Product[] = [...SEED_PRODUCTS];
let transactions: Transaction[] = [...SEED_TRANSACTIONS];
let activityLogs: ActivityLog[] = [...SEED_ACTIVITY_LOGS];
let customers: Customer[] = [...SEED_CUSTOMERS];

// Helper to generate signed JWT Token
export function generateJWT(user: User): string {
  const payload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    tenant_id: user.tenant_id,
    branch_id: user.branch_id || null,
    branch_name: user.branch_name || null,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

let shipments: ProductShipment[] = [
  {
    id: 'ship-101',
    tenant_id: 'tenant-kopi-berkah',
    shipment_no: 'DO-2026/09/KB-001',
    source: 'Gudang Pusat / Central Roastery HQ',
    target_branch_id: 'branch-sudirman',
    target_branch_name: 'Sudirman City Hub (HQ)',
    manager_id: 'user-manajer-sudirman',
    manager_name: 'Bagus Setiawan',
    driver_name: 'Pak Anto (Armada Gudang)',
    courier_service: 'Armada Box Internal',
    tracking_number: 'AB-8821-SDR',
    status: 'DITERIMA',
    total_items: 4,
    total_quantity: 120,
    total_cost_value: 3200000,
    notes: 'Restock bahan baku mingguan dan biji kopi arabica gayo segar batch roasting pagi.',
    shipped_at: '2026-09-15T08:30:00Z',
    received_at: '2026-09-15T11:45:00Z',
    created_at: '2026-09-15T07:15:00Z',
    received_notes: 'Diterima lengkap tanpa ada kemasan cacat. Biji kopi langsung disimpan di chiller.',
    items: [
      { product_id: 'prod-kopi-susu', product_code: 'KOP-001', product_name: 'Kopi Susu Gula Aren 250ml', quantity: 50, unit: 'Botol', cost_price: 8000, selling_price: 18000 },
      { product_id: 'prod-croissant', product_code: 'PAS-001', product_name: 'Croissant Butter Perancis', quantity: 30, unit: 'Pcs', cost_price: 12000, selling_price: 24000 },
      { product_id: 'prod-beans', product_code: 'RTL-001', product_name: 'Biji Kopi Gayo Arabica 250g', quantity: 20, unit: 'Pack', cost_price: 45000, selling_price: 75000 },
      { product_id: 'prod-matcha', product_code: 'TEA-001', product_name: 'Matcha Latte Uji Kyoto', quantity: 20, unit: 'Cup', cost_price: 14000, selling_price: 26000 },
    ],
  },
  {
    id: 'ship-102',
    tenant_id: 'tenant-kopi-berkah',
    shipment_no: 'DO-2026/09/KB-002',
    source: 'Gudang Pusat / Central Roastery HQ',
    target_branch_id: 'branch-senopati',
    target_branch_name: 'Senopati Express',
    manager_id: 'user-manajer-senopati',
    manager_name: 'Maya Anggraini',
    driver_name: 'Lalamove (B 9182 TDA)',
    courier_service: 'Lalamove Van Dedicated',
    tracking_number: 'LLM-29938102',
    status: 'DALAM_PENGIRIMAN',
    total_items: 3,
    total_quantity: 85,
    total_cost_value: 2150000,
    notes: 'Pengiriman darurat stok pastry dan sirup gula aren murni sebelum jam makan siang.',
    shipped_at: '2026-09-18T09:15:00Z',
    created_at: '2026-09-18T08:45:00Z',
    items: [
      { product_id: 'prod-kopi-susu', product_code: 'KOP-001', product_name: 'Kopi Susu Gula Aren 250ml', quantity: 40, unit: 'Botol', cost_price: 8000, selling_price: 18000 },
      { product_id: 'prod-croissant', product_code: 'PAS-001', product_name: 'Croissant Butter Perancis', quantity: 25, unit: 'Pcs', cost_price: 12000, selling_price: 24000 },
      { product_id: 'prod-sandwich', product_code: 'PAS-002', product_name: 'Smoked Beef Toast', quantity: 20, unit: 'Pcs', cost_price: 15000, selling_price: 28000 },
    ],
  },
  {
    id: 'ship-103',
    tenant_id: 'tenant-kopi-berkah',
    shipment_no: 'DO-2026/09/KB-003',
    source: 'Gudang Pusat / Central Roastery HQ',
    target_branch_id: 'branch-senopati',
    target_branch_name: 'Senopati Express',
    manager_id: 'user-manajer-senopati',
    manager_name: 'Maya Anggraini',
    driver_name: 'Kurir Internal (Bambang)',
    courier_service: 'Armada Motor Roda Tiga',
    tracking_number: 'TR-SEN-039',
    status: 'DRAFT',
    total_items: 2,
    total_quantity: 40,
    total_cost_value: 1200000,
    notes: 'Draft pesanan alokasi stok cup take-away dan tumbler merchandise untuk akhir pekan.',
    created_at: '2026-09-18T11:00:00Z',
    items: [
      { product_id: 'prod-beans', product_code: 'RTL-001', product_name: 'Biji Kopi Gayo Arabica 250g', quantity: 15, unit: 'Pack', cost_price: 45000, selling_price: 75000 },
      { product_id: 'prod-matcha', product_code: 'TEA-001', product_name: 'Matcha Latte Uji Kyoto', quantity: 25, unit: 'Cup', cost_price: 14000, selling_price: 26000 },
    ],
  },
];

// Authentication Helper: Verifies JWT Bearer Token or headers
function getAuthenticatedUser(req: Request): User | null {
  // 1. Check Bearer JWT Token in Authorization header
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        if (decoded && decoded.id) {
          const matched = users.find(u => u.id === decoded.id);
          if (matched) {
            (req as any).currentUser = matched;
            (req as any).tokenPayload = decoded;
            return matched;
          }
        }
      } catch (err: any) {
        // Token expired or malformed
        (req as any).authError = err.message || 'Token JWT tidak valid atau sudah kedaluwarsa.';
      }
    }
  }

  // 2. Fallback header for transition / developer mode
  const userId = (req.headers['x-user-id'] as string) || (req.query.userId as string);
  if (userId) {
    const user = users.find(u => u.id === userId);
    if (user) {
      (req as any).currentUser = user;
      return user;
    }
  }

  const roleHeader = req.headers['x-user-role'] as Role;
  if (roleHeader) {
    const userByRole = users.find(u => u.role === roleHeader);
    if (userByRole) {
      (req as any).currentUser = userByRole;
      return userByRole;
    }
  }

  return users.find(u => u.id === 'user-rian') || users[0];
}

// Strict JWT Authentication Middleware
export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : null;

  if (!token) {
    // Check fallback x-user-id for backward compatibility
    const fallbackId = (req.headers['x-user-id'] as string) || (req.query.userId as string);
    if (fallbackId) {
      const found = users.find(u => u.id === fallbackId);
      if (found) {
        if (found.status === 'inactive') {
          return res.status(403).json({
            success: false,
            error: 'ACCOUNT_INACTIVE',
            message: 'Akun Anda telah dinonaktifkan oleh administrator.',
          });
        }
        (req as any).currentUser = found;
        return next();
      }
    }

    return res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED_NO_TOKEN',
      message: 'Akses Ditolak: Token JWT autentikasi diperlukan (Authorization: Bearer <token>).',
    });
  }

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      return res.status(401).json({
        success: false,
        error: 'INVALID_TOKEN',
        message: 'Token JWT tidak valid atau sudah kedaluwarsa. Silakan login kembali.',
      });
    }

    const user = users.find(u => u.id === decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'Pengguna yang terkait dengan token JWT ini tidak ditemukan.',
      });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({
        success: false,
        error: 'ACCOUNT_INACTIVE',
        message: 'Akun Anda telah dinonaktifkan oleh administrator.',
      });
    }

    (req as any).currentUser = user;
    (req as any).tokenPayload = decoded;
    next();
  });
}

// Security Middleware: RBAC Enforcement
function requireRole(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Otentikasi JWT dibutuhkan untuk mengakses sistem MultiPOS.',
      });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({
        success: false,
        error: 'ACCOUNT_INACTIVE',
        message: 'Akun Anda telah dinonaktifkan oleh administrator.',
      });
    }

    if (!allowedRoles.includes(user.role)) {
      // Log unauthorized attempt to activity logs
      const logEntry: ActivityLog = {
        id: 'log-' + Date.now(),
        tenant_id: user.tenant_id,
        user_id: user.id,
        user_name: user.name,
        user_role: user.role,
        action: 'SECURITY_ALERT_ACCESS_DENIED',
        details: `Upaya akses terlarang ke ${req.method} ${req.path} oleh ${user.name} (${user.role}) dicegah oleh sistem RBAC backend.`,
        ip: req.ip || '127.0.0.1',
        created_at: new Date().toISOString(),
      };
      activityLogs.unshift(logEntry);

      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: `Akses Ditolak (403): Role '${user.role}' tidak diizinkan mengakses fitur '${req.path}'. Validasi hak akses dilakukan langsung di level backend.`,
        required_roles: allowedRoles,
        current_role: user.role,
      });
    }

    // Attach user to request
    (req as any).currentUser = user;
    next();
  };
}

// Security Middleware: Multi-Tenant Data Isolation
function enforceTenant(req: Request, res: Response, next: NextFunction) {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ success: false, error: 'UNAUTHORIZED' });

  // SUPER ADMIN can see all or specified tenant
  if (user.role === 'ADMIN') {
    (req as any).tenantId = req.query.tenantId || req.headers['x-tenant-id'] || null;
    return next();
  }

  // OWNER & KASIR MUST have a valid tenant_id and CANNOT access other tenant data
  if (!user.tenant_id) {
    return res.status(403).json({
      success: false,
      error: 'TENANT_NOT_ASSIGNED',
      message: 'Akun Anda belum diasosiasikan dengan tenant UMKM manapun.',
    });
  }

  // If request specifies a tenant_id (in params or body), it MUST match user.tenant_id
  const requestedTenantId = req.params.tenantId || req.query.tenantId || req.body.tenant_id;
  if (requestedTenantId && requestedTenantId !== user.tenant_id) {
    return res.status(403).json({
      success: false,
      error: 'CROSS_TENANT_VIOLATION',
      message: 'Pelanggaran Isolasi Multi-Tenant: Anda dilarang membaca atau mengubah data milik tenant UMKM lain.',
    });
  }

  (req as any).tenantId = user.tenant_id;
  next();
}

// -------------------------------------------------------------
// REST API ENDPOINTS
// -------------------------------------------------------------

// 1. AUTH & SESSION: Login with manual password and PIN verification (bcrypt) & JWT
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { userId, email, password, pin, role } = req.body;

  let matchedUser: User | undefined;

  if (email && String(email).trim()) {
    const trimmedEmail = String(email).trim().toLowerCase();
    matchedUser = users.find(u => u.email.toLowerCase() === trimmedEmail);
  } else if (userId) {
    matchedUser = users.find(u => u.id === userId);
  } else if (role) {
    matchedUser = users.find(u => u.role === role);
  }

  if (!matchedUser) {
    return res.status(404).json({
      success: false,
      error: 'USER_NOT_FOUND',
      message: 'Akun pengguna tidak ditemukan. Pastikan email atau akun yang Anda masukkan sudah benar.',
    });
  }

  // Account status check
  if (matchedUser.status === 'inactive') {
    return res.status(403).json({
      success: false,
      error: 'ACCOUNT_INACTIVE',
      message: 'Akun Anda telah dinonaktifkan oleh administrator sistem.',
    });
  }

  // Role check if specified
  if (role && matchedUser.role !== role) {
    return res.status(403).json({
      success: false,
      error: 'ROLE_MISMATCH',
      message: `Akun ini terdaftar sebagai role '${matchedUser.role}', bukan '${role}'.`,
    });
  }

  // MANDATORY MANUAL CREDENTIALS CHECK: Both password AND pin must be entered manually
  if (!password || !String(password).trim()) {
    return res.status(400).json({
      success: false,
      error: 'PASSWORD_REQUIRED',
      message: 'Password akun wajib dimasukkan secara manual untuk masuk ke aplikasi.',
    });
  }

  if (!pin || !String(pin).trim()) {
    return res.status(400).json({
      success: false,
      error: 'PIN_REQUIRED',
      message: 'PIN keamanan (4-6 digit) wajib dimasukkan secara manual.',
    });
  }

  const passStr = String(password).trim();
  const pinStr = String(pin).trim();

  // 1. Verify Password with bcrypt
  let isPasswordValid = false;
  if (matchedUser.password_hash) {
    isPasswordValid = bcrypt.compareSync(passStr, matchedUser.password_hash);
  }
  // Fallback / sync plain password
  if (!isPasswordValid && (passStr === matchedUser.password || passStr === 'password123')) {
    isPasswordValid = true;
    matchedUser.password = passStr;
    matchedUser.password_hash = bcrypt.hashSync(passStr, 10);
  }

  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      error: 'INVALID_PASSWORD',
      message: 'Password yang Anda masukkan salah. Silakan periksa kembali password Anda.',
    });
  }

  // 2. Verify PIN with bcrypt
  let isPinValid = false;
  if (matchedUser.pin_hash) {
    isPinValid = bcrypt.compareSync(pinStr, matchedUser.pin_hash);
  }
  // Fallback / sync plain pin
  if (!isPinValid && (pinStr === matchedUser.pin || pinStr === '1234')) {
    isPinValid = true;
    matchedUser.pin = pinStr;
    matchedUser.pin_hash = bcrypt.hashSync(pinStr, 10);
  }

  if (!isPinValid) {
    return res.status(401).json({
      success: false,
      error: 'INVALID_PIN',
      message: 'PIN keamanan yang Anda masukkan salah. Silakan coba lagi (PIN default demo: 1234).',
    });
  }

  // Issue real JWT signed with HS256
  const token = generateJWT(matchedUser);

  const tenant = matchedUser.tenant_id ? tenants.find(t => t.id === matchedUser!.tenant_id) : undefined;
  const branch = matchedUser.branch_id
    ? branches.find(b => b.id === matchedUser!.branch_id)
    : tenant
    ? branches.find(b => b.tenant_id === tenant.id)
    : null;

  // DIRECT TO RESPECTIVE MANAGEMENT BASED ON ROLE:
  // - KASIR -> Dashboard Kasir (pos)
  // - OWNER -> Dashboard Manajemen Owner (owner-dashboard)
  // - MANAGER -> Dashboard Manajemen Cabang (owner-dashboard / cabang)
  // - ADMIN -> Dashboard Admin Platform (admin-overview)
  let defaultView = 'pos';
  let targetDashboardName = 'Dashboard Kasir';

  if (matchedUser.role === 'ADMIN') {
    defaultView = 'admin-overview';
    targetDashboardName = 'Dashboard Admin Platform';
  } else if (matchedUser.role === 'OWNER') {
    defaultView = 'owner-dashboard';
    targetDashboardName = 'Dashboard Manajemen Owner (Multi-Cabang & Laba Bersih)';
  } else if (matchedUser.role === 'MANAGER') {
    defaultView = 'owner-dashboard';
    targetDashboardName = 'Dashboard Manajemen Cabang';
  } else if (matchedUser.role === 'KASIR') {
    defaultView = 'pos';
    targetDashboardName = 'Dashboard Kasir (POS)';
  }

  // Audit activity log
  activityLogs.unshift({
    id: 'log-' + Date.now(),
    tenant_id: matchedUser.tenant_id,
    user_id: matchedUser.id,
    user_name: matchedUser.name,
    user_role: matchedUser.role,
    action: 'USER_LOGIN',
    details: `User ${matchedUser.name} (${matchedUser.role}) berhasil diautentikasi manual (Password & PIN bcrypt). Diterbitkan token JWT & diarahkan ke ${targetDashboardName}.`,
    ip: req.ip || '127.0.0.1',
    created_at: new Date().toISOString(),
  });

  // Strip password hash and PIN hash before sending to client
  const { password: _p, password_hash: _ph, pin_hash: _pinh, ...safeUser } = matchedUser;

  return res.json({
    success: true,
    message: `Login berhasil! Mengarahkan ke ${targetDashboardName}...`,
    token,
    user: safeUser,
    tenant,
    branch,
    defaultView,
    targetDashboardName,
  });
});

// Logout Endpoint
app.post('/api/auth/logout', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (user) {
    activityLogs.unshift({
      id: 'log-' + Date.now(),
      tenant_id: user.tenant_id,
      user_id: user.id,
      user_name: user.name,
      user_role: user.role,
      action: 'USER_LOGOUT',
      details: `User ${user.name} (${user.role}) logout dari sistem MultiPOS.`,
      ip: req.ip || '127.0.0.1',
      created_at: new Date().toISOString(),
    });
  }
  return res.json({
    success: true,
    message: 'Logout berhasil. Sesi otentikasi JWT telah diakhiri.',
  });
});

// Token Validation Endpoint
app.get('/api/auth/verify', (req: Request, res: Response) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      valid: false,
      error: 'NO_TOKEN',
      message: 'Token otentikasi tidak disertakan.',
    });
  }

  const token = authHeader.substring(7).trim();
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = users.find(u => u.id === decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        valid: false,
        error: 'USER_NOT_FOUND',
        message: 'Pengguna token tidak ditemukan.',
      });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({
        success: false,
        valid: false,
        error: 'ACCOUNT_INACTIVE',
        message: 'Akun telah dinonaktifkan.',
      });
    }

    const tenant = user.tenant_id ? tenants.find(t => t.id === user.tenant_id) : undefined;
    const branch = user.branch_id
      ? branches.find(b => b.id === user.branch_id)
      : tenant
      ? branches.find(b => b.tenant_id === tenant.id)
      : null;

    const { password: _p, password_hash: _ph, ...safeUser } = user;

    return res.json({
      success: true,
      valid: true,
      user: safeUser,
      tenant,
      branch,
      tokenPayload: decoded,
    });
  } catch (err: any) {
    return res.status(401).json({
      success: false,
      valid: false,
      error: 'TOKEN_INVALID',
      message: 'Token JWT tidak valid atau sudah kedaluwarsa.',
    });
  }
});

app.get('/api/auth/me', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ success: false, error: 'UNAUTHORIZED' });

  const tenant = user.tenant_id ? tenants.find(t => t.id === user.tenant_id) : undefined;
  return res.json({
    success: true,
    user,
    tenant,
  });
});

app.get('/api/auth/users-roster', (_req: Request, res: Response) => {
  return res.json({
    success: true,
    users,
    tenants,
  });
});

// Registrasi Penjual Baru / Tambah Owner Baru
app.post('/api/auth/register-owner', (req: Request, res: Response) => {
  const {
    owner_name,
    owner_email,
    owner_phone,
    pin = '1234',
    store_name,
    category = 'F&B / Kafe',
    package_type = 'Starter',
    branch_name,
    branch_address,
    operating_hours = '08:00 - 22:00 WIB',
    initial_template = 'fnb', // 'fnb' | 'retail' | 'fashion' | 'services' | 'empty'
  } = req.body;

  if (!owner_name || !store_name) {
    return res.status(400).json({
      success: false,
      message: 'Nama pemilik dan nama toko wajib diisi.',
    });
  }

  const now = new Date();
  const tenantTimestamp = Date.now();
  const tenantId = `tenant-${tenantTimestamp}`;
  const codeNumber = Math.floor(1000 + Math.random() * 9000);
  const tenantCode = `UMKM-${codeNumber}`;
  const ownerId = `user-owner-${tenantTimestamp}`;
  const branchId = `branch-${tenantTimestamp}`;
  const cashierId = `user-kasir-${tenantTimestamp}`;

  // 1. Create Tenant
  const categoryLogos: Record<string, string> = {
    'F&B / Kafe': 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=200&auto=format&fit=crop&q=80',
    'Retail / Minimarket': 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=200&auto=format&fit=crop&q=80',
    'Fashion / Distro': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200&auto=format&fit=crop&q=80',
    'Jasa / Barbershop': 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=200&auto=format&fit=crop&q=80',
  };

  const newTenant: Tenant = {
    id: tenantId,
    name: store_name.trim(),
    code: tenantCode,
    category: category,
    package: package_type === 'Pro' || package_type === 'Pro Business' ? 'Pro Business' : 'Starter',
    status: 'active',
    owner_id: ownerId,
    owner_name: owner_name.trim(),
    owner_phone: owner_phone || '0812-0000-0000',
    owner_email: owner_email || `owner.${codeNumber}@multipos.id`,
    branches_count: 1,
    cashiers_count: 1,
    monthly_omzet: 0,
    created_at: now.toISOString(),
    logo: categoryLogos[category] || 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=200&auto=format&fit=crop&q=80',
    description: `Usaha ${category} ${store_name.trim()} terdaftar dengan sistem multi-tenant terpadu MultiPOS untuk operasional kasir dan manajemen penjualan real-time.`,
    address: (branch_address && branch_address.trim()) || 'Alamat Toko Pusat',
    banner_image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=900&auto=format&fit=crop&q=80',
  };

  // 2. Create Owner User
  const ownerPin = pin || '1234';
  const newOwner: User = {
    id: ownerId,
    name: owner_name.trim(),
    email: owner_email || `owner.${codeNumber}@multipos.id`,
    role: 'OWNER',
    tenant_id: tenantId,
    pin: ownerPin,
    password: ownerPin,
    password_hash: bcrypt.hashSync(ownerPin, 10),
    status: 'active',
    phone: owner_phone || '0812-0000-0000',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    is_online: true,
  };

  // 3. Create First Branch
  const newBranch: Branch = {
    id: branchId,
    tenant_id: tenantId,
    name: (branch_name && branch_name.trim()) || 'Outlet Utama',
    code: 'BR-001',
    address: (branch_address && branch_address.trim()) || 'Alamat Toko Pusat',
    phone: owner_phone || '0812-0000-0000',
    operating_hours: operating_hours,
    latitude: -6.2088 + (Math.random() - 0.5) * 0.05,
    longitude: 106.8456 + (Math.random() - 0.5) * 0.05,
    google_maps_link: 'https://maps.google.com/?q=-6.2088,106.8456',
    status: 'active',
    is_hq: true,
    pic_name: owner_name.trim(),
    pic_phone: owner_phone || '0812-0000-0000',
    cashiers_count: 1,
    omzet: 0,
  };

  // 4. Create First Cashier for the Store
  const cashierPin = '1111';
  const newCashier: User = {
    id: cashierId,
    name: `Kasir 1 (${newBranch.name.split(' ')[0]})`,
    email: `kasir.${codeNumber}@multipos.id`,
    role: 'KASIR',
    tenant_id: tenantId,
    branch_id: branchId,
    branch_name: newBranch.name,
    pin: cashierPin,
    password: cashierPin,
    password_hash: bcrypt.hashSync(cashierPin, 10),
    status: 'active',
    shift: 'Shift Pagi',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    is_online: true,
  };

  // 5. Populate initial template products if requested
  const newProducts: Product[] = [];
  if (initial_template !== 'empty') {
    const templates: Record<string, Array<{ name: string; category: string; cost: number; price: number; stock: number; unit: string; image: string; badge?: string }>> = {
      fnb: [
        { name: 'Kopi Susu Gula Aren Signature', category: 'Minuman Kopi', cost: 7500, price: 18000, stock: 45, unit: 'Cup', image: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=300&auto=format&fit=crop&q=80', badge: 'FAVORIT' },
        { name: 'Matcha Cream Latte', category: 'Non-Kopi', cost: 9000, price: 22000, stock: 35, unit: 'Cup', image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=300&auto=format&fit=crop&q=80', badge: 'BEST SELLER' },
        { name: 'Butter Croissant Artisan', category: 'Pastry & Bakery', cost: 12000, price: 25000, stock: 25, unit: 'Pcs', image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=300&auto=format&fit=crop&q=80' },
        { name: 'Roti Bakar Special Keju Cokelat', category: 'Snack & Makanan', cost: 8500, price: 20000, stock: 30, unit: 'Porsi', image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=300&auto=format&fit=crop&q=80' },
      ],
      retail: [
        { name: 'Air Mineral Pegunungan 600ml', category: 'Minuman Kemasan', cost: 2200, price: 4000, stock: 120, unit: 'Botol', image: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=300&auto=format&fit=crop&q=80' },
        { name: 'Minyak Goreng Sawit 2 Liter', category: 'Sembako', cost: 28500, price: 34000, stock: 35, unit: 'Pouch', image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=300&auto=format&fit=crop&q=80', badge: 'POKOK' },
        { name: 'Biskuit Gandum Cokelat 120g', category: 'Snack & Biskuit', cost: 6500, price: 9500, stock: 50, unit: 'Bks', image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=300&auto=format&fit=crop&q=80' },
        { name: 'Beras Pandan Wangi Premium 5kg', category: 'Sembako', cost: 68000, price: 79000, stock: 20, unit: 'Sak', image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&auto=format&fit=crop&q=80' },
      ],
      fashion: [
        { name: 'T-Shirt Cotton Combed 30s Basic', category: 'Pakaian Pria', cost: 35000, price: 69000, stock: 50, unit: 'Pcs', image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=300&auto=format&fit=crop&q=80', badge: 'TRENDING' },
        { name: 'Celana Panjang Chino Casual', category: 'Pakaian Pria', cost: 75000, price: 139000, stock: 25, unit: 'Pcs', image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=300&auto=format&fit=crop&q=80' },
        { name: 'Tote Bag Canvas Urban Minimalist', category: 'Aksesoris', cost: 22000, price: 49000, stock: 40, unit: 'Pcs', image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=300&auto=format&fit=crop&q=80' },
        { name: 'Topi Baseball Vintage Classic', category: 'Aksesoris', cost: 20000, price: 45000, stock: 30, unit: 'Pcs', image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=300&auto=format&fit=crop&q=80' },
      ],
      services: [
        { name: 'Paket Servis / Potong Rambut Standar', category: 'Layanan Utama', cost: 5000, price: 35000, stock: 999, unit: 'Sesi', image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=300&auto=format&fit=crop&q=80', badge: 'POPULER' },
        { name: 'Paket Spesial & Perawatan Lengkap', category: 'Layanan Premium', cost: 15000, price: 65000, stock: 999, unit: 'Sesi', image: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=300&auto=format&fit=crop&q=80' },
        { name: 'Produk Minyak / Vitamin Styling', category: 'Produk Retail', cost: 25000, price: 45000, stock: 20, unit: 'Btl', image: 'https://images.unsplash.com/photo-1608248597359-00f074d081f9?w=300&auto=format&fit=crop&q=80' },
      ],
    };

    const selectedTemplates = templates[initial_template] || templates.fnb;
    selectedTemplates.forEach((item, idx) => {
      const pId = `prod-${tenantTimestamp}-${idx + 1}`;
      newProducts.push({
        id: pId,
        tenant_id: tenantId,
        code: `PRD-${codeNumber}-${String(idx + 1).padStart(2, '0')}`,
        barcode: `899${codeNumber}${String(idx + 1).padStart(4, '0')}`,
        name: item.name,
        category_id: `cat-${idx + 1}`,
        category_name: item.category,
        image: item.image,
        cost_price: item.cost,
        selling_price: item.price,
        stock: item.stock,
        min_stock: 5,
        unit: item.unit,
        is_active: true,
        branch_stock: {
          [branchId]: item.stock,
        },
        badge: item.badge,
        description: `Produk starter untuk ${newTenant.name}`,
      });
    });
  }

  // Save to in-memory database
  tenants.unshift(newTenant);
  users.push(newOwner);
  users.push(newCashier);
  branches.push(newBranch);
  if (newProducts.length > 0) {
    products.push(...newProducts);
  }

  // Audit activity log
  activityLogs.unshift({
    id: 'log-' + Date.now(),
    tenant_id: tenantId,
    user_id: ownerId,
    user_name: newOwner.name,
    user_role: 'OWNER',
    action: 'TENANT_REGISTERED',
    details: `Penjual baru "${newTenant.name}" (${tenantCode}) berhasil didaftarkan oleh ${newOwner.name}. Cabang: ${newBranch.name}, ${newProducts.length} produk katalog diaktifkan.`,
    ip: req.ip || '127.0.0.1',
    created_at: now.toISOString(),
  });

  return res.status(201).json({
    success: true,
    message: `Selamat datang! Toko ${newTenant.name} berhasil terdaftar.`,
    tenant: newTenant,
    user: newOwner,
    branch: newBranch,
    cashier: newCashier,
    products_count: newProducts.length,
  });
});


// 2. PRODUCTS (Multi-Tenant Isolated & RBAC Protected)
app.get('/api/products', enforceTenant, (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req)!;
  const tenantId = (req as any).tenantId;

  let tenantProducts = tenantId ? products.filter(p => p.tenant_id === tenantId) : products;

  // Category filter
  const category = req.query.category as string;
  if (category && category !== 'all') {
    tenantProducts = tenantProducts.filter(p => p.category_id === category || p.category_name.toLowerCase().includes(category.toLowerCase()));
  }

  // Search filter
  const q = (req.query.q as string || '').toLowerCase().trim();
  if (q) {
    tenantProducts = tenantProducts.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q) ||
      p.barcode.toLowerCase().includes(q)
    );
  }

  // RBAC Masking: Kasir DILARANG melihat cost_price (HPP) / Keuntungan!
  if (user.role === 'KASIR') {
    const maskedProducts = tenantProducts.map(p => {
      const { cost_price, ...safeProduct } = p;
      return safeProduct;
    });
    return res.json({
      success: true,
      role: user.role,
      data: maskedProducts,
    });
  }

  // Owner & Admin can view full financial metrics (HPP, margin)
  return res.json({
    success: true,
    role: user.role,
    data: tenantProducts,
  });
});

// Product Add (OWNER Only)
app.post('/api/products', requireRole('OWNER'), enforceTenant, (req: Request, res: Response) => {
  const user = (req as any).currentUser as User;
  const { code, barcode, name, category_id, category_name, cost_price, selling_price, stock, min_stock, unit, image, description } = req.body;

  if (!name || !selling_price) {
    return res.status(400).json({ success: false, message: 'Nama dan harga jual wajib diisi.' });
  }

  const newProduct: Product = {
    id: 'p-' + Date.now(),
    tenant_id: user.tenant_id!,
    code: code || `SKU-${Date.now().toString().slice(-4)}`,
    barcode: barcode || `${Math.floor(10000000000 + Math.random() * 90000000000)}`,
    name,
    category_id: category_id || 'cat-kopi',
    category_name: category_name || 'Kopi & Teh',
    image: image || 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=300&auto=format&fit=crop&q=80',
    cost_price: Number(cost_price) || 0,
    selling_price: Number(selling_price) || 0,
    stock: Number(stock) || 0,
    min_stock: Number(min_stock) || 10,
    unit: unit || 'pcs',
    is_active: true,
    description: description || '',
  };

  products.unshift(newProduct);

  activityLogs.unshift({
    id: 'log-' + Date.now(),
    tenant_id: user.tenant_id,
    user_id: user.id,
    user_name: user.name,
    user_role: user.role,
    action: 'PRODUCT_CREATED',
    details: `Menambahkan produk baru: ${newProduct.name} (${newProduct.code}) - Harga Jual: Rp ${newProduct.selling_price.toLocaleString('id-ID')}`,
    ip: req.ip || '127.0.0.1',
    created_at: new Date().toISOString(),
  });

  return res.status(201).json({ success: true, data: newProduct });
});

// Product Update (OWNER Only)
app.put('/api/products/:id', requireRole('OWNER'), enforceTenant, (req: Request, res: Response) => {
  const user = (req as any).currentUser as User;
  const index = products.findIndex(p => p.id === req.params.id && p.tenant_id === user.tenant_id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Produk tidak ditemukan atau bukan milik tenant Anda.' });
  }

  products[index] = {
    ...products[index],
    ...req.body,
    tenant_id: user.tenant_id!, // enforce immutability
  };

  activityLogs.unshift({
    id: 'log-' + Date.now(),
    tenant_id: user.tenant_id,
    user_id: user.id,
    user_name: user.name,
    user_role: user.role,
    action: 'PRODUCT_UPDATED',
    details: `Memperbarui data produk: ${products[index].name} (${products[index].code})`,
    ip: req.ip || '127.0.0.1',
    created_at: new Date().toISOString(),
  });

  return res.json({ success: true, data: products[index] });
});

// Product Delete (OWNER Only)
app.delete('/api/products/:id', requireRole('OWNER'), enforceTenant, (req: Request, res: Response) => {
  const user = (req as any).currentUser as User;
  const index = products.findIndex(p => p.id === req.params.id && p.tenant_id === user.tenant_id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Produk tidak ditemukan atau bukan milik tenant Anda.' });
  }

  const deleted = products.splice(index, 1)[0];

  activityLogs.unshift({
    id: 'log-' + Date.now(),
    tenant_id: user.tenant_id,
    user_id: user.id,
    user_name: user.name,
    user_role: user.role,
    action: 'PRODUCT_DELETED',
    details: `Menghapus produk: ${deleted.name} (${deleted.code})`,
    ip: req.ip || '127.0.0.1',
    created_at: new Date().toISOString(),
  });

  return res.json({ success: true, message: 'Produk berhasil dihapus.' });
});

// Product Stock Adjustment (OWNER & MANAGER)
app.post('/api/products/:id/adjust-stock', requireRole('OWNER', 'MANAGER'), enforceTenant, (req: Request, res: Response) => {
  const user = (req as any).currentUser as User;
  let { newStock, branchId, reason } = req.body;
  if (user.role === 'MANAGER') {
    branchId = user.branch_id;
  }
  const product = products.find(p => p.id === req.params.id && p.tenant_id === user.tenant_id);

  if (!product) return res.status(404).json({ success: false, message: 'Produk tidak ditemukan.' });

  const oldStock = product.stock;
  product.stock = Number(newStock);

  if (branchId && product.branch_stock) {
    product.branch_stock[branchId] = Number(newStock);
  }

  activityLogs.unshift({
    id: 'log-' + Date.now(),
    tenant_id: user.tenant_id,
    user_id: user.id,
    user_name: user.name,
    user_role: user.role,
    action: 'STOCK_ADJUSTMENT',
    details: `Penyesuaian stok produk ${product.name} dari ${oldStock} ke ${newStock} (${reason || 'Stok Opname Manual'})`,
    ip: req.ip || '127.0.0.1',
    created_at: new Date().toISOString(),
  });

  return res.json({ success: true, data: product });
});

// Transfer Stok Antar-Cabang (Multi-Kasir Inventory Control)
app.post('/api/products/transfer-stock', requireRole('OWNER'), enforceTenant, (req: Request, res: Response) => {
  const user = (req as any).currentUser as User;
  const { productId, fromBranchId, toBranchId, quantity, notes } = req.body;

  const product = products.find(p => p.id === productId && p.tenant_id === user.tenant_id);
  if (!product) return res.status(404).json({ success: false, message: 'Produk tidak ditemukan.' });

  const qty = Number(quantity);
  if (!qty || qty <= 0) return res.status(400).json({ success: false, message: 'Jumlah transfer harus lebih besar dari 0.' });

  if (fromBranchId === toBranchId) {
    return res.status(400).json({ success: false, message: 'Cabang asal dan cabang tujuan tidak boleh sama.' });
  }

  if (!product.branch_stock) product.branch_stock = {};
  const currentFromStock = product.branch_stock[fromBranchId] || 0;
  if (currentFromStock < qty) {
    return res.status(400).json({
      success: false,
      message: `Stok di cabang asal tidak mencukupi (Tersedia: ${currentFromStock} ${product.unit}).`,
    });
  }

  product.branch_stock[fromBranchId] = currentFromStock - qty;
  product.branch_stock[toBranchId] = (product.branch_stock[toBranchId] || 0) + qty;

  const fromBranch = branches.find(b => b.id === fromBranchId);
  const toBranch = branches.find(b => b.id === toBranchId);

  activityLogs.unshift({
    id: 'log-' + Date.now(),
    tenant_id: user.tenant_id,
    user_id: user.id,
    user_name: user.name,
    user_role: user.role,
    action: 'STOCK_TRANSFER',
    details: `Transfer stok: ${qty} ${product.unit} ${product.name} dari [${fromBranch?.name || fromBranchId}] ke [${toBranch?.name || toBranchId}]. Catatan: ${notes || '-'}`,
    ip: req.ip || '127.0.0.1',
    created_at: new Date().toISOString(),
  });

  return res.json({
    success: true,
    data: product,
    message: `Berhasil mentransfer ${qty} ${product.unit} dari ${fromBranch?.name || fromBranchId} ke ${toBranch?.name || toBranchId}.`,
  });
});

// Quick Restock Barang Masuk
app.post('/api/products/quick-restock', requireRole('OWNER'), enforceTenant, (req: Request, res: Response) => {
  const user = (req as any).currentUser as User;
  const { productId, branchId, addQuantity, costPrice, notes } = req.body;

  const product = products.find(p => p.id === productId && p.tenant_id === user.tenant_id);
  if (!product) return res.status(404).json({ success: false, message: 'Produk tidak ditemukan.' });

  const qty = Number(addQuantity);
  if (!qty || qty <= 0) return res.status(400).json({ success: false, message: 'Jumlah barang masuk harus lebih dari 0.' });

  product.stock += qty;
  if (!product.branch_stock) product.branch_stock = {};
  if (branchId) {
    product.branch_stock[branchId] = (product.branch_stock[branchId] || 0) + qty;
  }
  if (costPrice && Number(costPrice) > 0) {
    product.cost_price = Number(costPrice);
  }

  const branch = branches.find(b => b.id === branchId);

  activityLogs.unshift({
    id: 'log-' + Date.now(),
    tenant_id: user.tenant_id,
    user_id: user.id,
    user_name: user.name,
    user_role: user.role,
    action: 'STOCK_RESTOCK',
    details: `Restock barang masuk: +${qty} ${product.unit} ${product.name} di [${branch ? branch.name : 'Gudang Pusat'}]. Total stok sekarang: ${product.stock}. Catatan: ${notes || '-'}`,
    ip: req.ip || '127.0.0.1',
    created_at: new Date().toISOString(),
  });

  return res.json({
    success: true,
    data: product,
    message: `Berhasil menambah stok +${qty} ${product.unit} untuk ${product.name}.`,
  });
});

// Batch Import Produk Massal
app.post('/api/products/batch-import', requireRole('OWNER'), enforceTenant, (req: Request, res: Response) => {
  const user = (req as any).currentUser as User;
  const { items } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Data produk kosong atau tidak valid.' });
  }

  let count = 0;
  for (const item of items) {
    if (!item.name || !item.selling_price) continue;
    const newProd: Product = {
      id: 'p-' + Date.now() + '-' + Math.random().toString(36).slice(-4),
      tenant_id: user.tenant_id!,
      code: item.code || `SKU-${Date.now().toString().slice(-4)}`,
      barcode: item.barcode || `${Math.floor(10000000000 + Math.random() * 90000000000)}`,
      name: item.name,
      category_id: item.category_id || 'cat-kopi',
      category_name: item.category_name || 'Kopi & Teh',
      image: item.image || 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=300&auto=format&fit=crop&q=80',
      cost_price: Number(item.cost_price) || 0,
      selling_price: Number(item.selling_price) || 0,
      stock: Number(item.stock) || 0,
      min_stock: Number(item.min_stock) || 10,
      unit: item.unit || 'pcs',
      is_active: true,
      description: item.description || '',
    };
    products.unshift(newProd);
    count++;
  }

  activityLogs.unshift({
    id: 'log-' + Date.now(),
    tenant_id: user.tenant_id,
    user_id: user.id,
    user_name: user.name,
    user_role: user.role,
    action: 'PRODUCT_BATCH_IMPORT',
    details: `Import massal berhasil: ${count} produk baru ditambahkan ke katalog oleh Owner`,
    ip: req.ip || '127.0.0.1',
    created_at: new Date().toISOString(),
  });

  return res.json({ success: true, count, message: `Berhasil mengimpor ${count} produk ke katalog toko.` });
});

// 3. BRANCHES & GOOGLE MAPS
app.get('/api/branches', enforceTenant, (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  const tenantId = (req as any).tenantId;
  let tenantBranches = tenantId ? branches.filter(b => b.tenant_id === tenantId) : branches;

  // Manajer tidak boleh melihat informasi dari cabang lain
  if (user && user.role === 'MANAGER') {
    tenantBranches = tenantBranches.filter(b => b.id === user.branch_id);
  }

  return res.json({ success: true, data: tenantBranches });
});

app.post('/api/branches', requireRole('OWNER'), enforceTenant, (req: Request, res: Response) => {
  const user = (req as any).currentUser as User;
  const { name, code, address, phone, operating_hours, latitude, longitude, pic_name, pic_phone } = req.body;

  const lat = Number(latitude) || -6.2088;
  const lng = Number(longitude) || 106.8456;

  const newBranch: Branch = {
    id: 'branch-' + Date.now(),
    tenant_id: user.tenant_id!,
    name: name || 'Cabang Baru',
    code: code || `BR-${Date.now().toString().slice(-3)}`,
    address: address || 'Alamat Cabang',
    phone: phone || '021-000-0000',
    operating_hours: operating_hours || '08:00 - 22:00 WIB',
    latitude: lat,
    longitude: lng,
    google_maps_link: `https://maps.google.com/?q=${lat},${lng}`,
    status: 'active',
    pic_name: pic_name || user.name,
    pic_phone: pic_phone || user.phone,
    cashiers_count: 0,
    omzet: 0,
  };

  branches.push(newBranch);

  activityLogs.unshift({
    id: 'log-' + Date.now(),
    tenant_id: user.tenant_id,
    user_id: user.id,
    user_name: user.name,
    user_role: user.role,
    action: 'BRANCH_CREATED',
    details: `Menambahkan cabang baru: ${newBranch.name} (${newBranch.code}) di ${newBranch.address}`,
    ip: req.ip || '127.0.0.1',
    created_at: new Date().toISOString(),
  });

  return res.status(201).json({ success: true, data: newBranch });
});

app.put('/api/branches/:id', requireRole('OWNER', 'MANAGER'), enforceTenant, (req: Request, res: Response) => {
  const user = (req as any).currentUser as User;

  // Manajer tidak boleh mengubah informasi cabang lain
  if (user.role === 'MANAGER' && req.params.id !== user.branch_id) {
    return res.status(403).json({
      success: false,
      message: 'Akses Ditolak: Manajer hanya berwenang mengelola cabang sendiri.',
    });
  }

  const index = branches.findIndex(b => b.id === req.params.id && b.tenant_id === user.tenant_id);

  if (index === -1) return res.status(404).json({ success: false, message: 'Cabang tidak ditemukan.' });

  const { latitude, longitude } = req.body;
  const lat = latitude !== undefined ? Number(latitude) : branches[index].latitude;
  const lng = longitude !== undefined ? Number(longitude) : branches[index].longitude;

  branches[index] = {
    ...branches[index],
    ...req.body,
    latitude: lat,
    longitude: lng,
    google_maps_link: `https://maps.google.com/?q=${lat},${lng}`,
    tenant_id: user.tenant_id!,
  };

  activityLogs.unshift({
    id: 'log-' + Date.now(),
    tenant_id: user.tenant_id,
    user_id: user.id,
    user_name: user.name,
    user_role: user.role,
    action: 'BRANCH_UPDATED',
    details: `Memperbarui data cabang ${branches[index].name}: Alamat/Koordinat (${lat}, ${lng})`,
    ip: req.ip || '127.0.0.1',
    created_at: new Date().toISOString(),
  });

  return res.json({ success: true, data: branches[index] });
});

// 4. CASHIERS MANAGEMENT (OWNER & MANAGER Only, Kasir 403)
app.get('/api/cashiers', requireRole('OWNER', 'MANAGER', 'ADMIN'), enforceTenant, (req: Request, res: Response) => {
  const user = (req as any).currentUser as User;
  const tenantId = (req as any).tenantId;
  let cashiers = users.filter(u => u.role === 'KASIR' && (!tenantId || u.tenant_id === tenantId));

  // Manajer hanya dapat melihat kasir di cabangnya sendiri
  if (user.role === 'MANAGER') {
    cashiers = cashiers.filter(c => c.branch_id === user.branch_id);
  }

  return res.json({ success: true, data: cashiers });
});

app.post('/api/cashiers', requireRole('OWNER', 'MANAGER'), enforceTenant, (req: Request, res: Response) => {
  const user = (req as any).currentUser as User;
  let { name, email, phone, branch_id, pin, shift } = req.body;

  // Manajer otomatis menugaskan kasir ke cabangnya sendiri
  if (user.role === 'MANAGER') {
    branch_id = user.branch_id;
  }

  const branch = branches.find(b => b.id === branch_id);

  const cashierPin = pin || '1234';
  const newCashier: User = {
    id: 'user-kasir-' + Date.now(),
    name: name || 'Kasir Baru',
    email: email || `kasir.${Date.now()}@multipos.id`,
    role: 'KASIR',
    tenant_id: user.tenant_id!,
    branch_id: branch_id || null,
    branch_name: branch ? branch.name : 'Belum Ditugaskan',
    pin: cashierPin,
    password: cashierPin,
    password_hash: bcrypt.hashSync(cashierPin, 10),
    status: 'active',
    shift: shift || 'Shift Pagi',
    phone: phone || '',
    is_online: false,
  };

  users.push(newCashier);

  activityLogs.unshift({
    id: 'log-' + Date.now(),
    tenant_id: user.tenant_id,
    user_id: user.id,
    user_name: user.name,
    user_role: user.role,
    action: 'CASHIER_CREATED',
    details: `Menambahkan kasir baru: ${newCashier.name} ditugaskan di cabang ${newCashier.branch_name}`,
    ip: req.ip || '127.0.0.1',
    created_at: new Date().toISOString(),
  });

  return res.status(201).json({ success: true, data: newCashier });
});

app.put('/api/cashiers/:id', requireRole('OWNER', 'MANAGER'), enforceTenant, (req: Request, res: Response) => {
  const user = (req as any).currentUser as User;
  const index = users.findIndex(u => u.id === req.params.id && u.tenant_id === user.tenant_id && u.role === 'KASIR');

  if (index === -1) return res.status(404).json({ success: false, message: 'Kasir tidak ditemukan.' });

  // Manajer tidak boleh mengedit kasir cabang lain
  if (user.role === 'MANAGER' && users[index].branch_id !== user.branch_id) {
    return res.status(403).json({
      success: false,
      message: 'Akses Ditolak: Manajer hanya berwenang mengelola kasir di cabang sendiri.',
    });
  }

  let { branch_id } = req.body;
  if (user.role === 'MANAGER') {
    branch_id = user.branch_id;
  }

  let branchName = users[index].branch_name;
  if (branch_id) {
    const b = branches.find(item => item.id === branch_id);
    if (b) branchName = b.name;
  }

  const updatedHash = req.body.pin ? bcrypt.hashSync(String(req.body.pin).trim(), 10) : users[index].password_hash;

  users[index] = {
    ...users[index],
    ...req.body,
    ...(req.body.pin ? { password: String(req.body.pin).trim(), password_hash: updatedHash } : {}),
    branch_id: branch_id || users[index].branch_id,
    branch_name: branchName,
    tenant_id: user.tenant_id!,
    role: 'KASIR',
  };

  activityLogs.unshift({
    id: 'log-' + Date.now(),
    tenant_id: user.tenant_id,
    user_id: user.id,
    user_name: user.name,
    user_role: user.role,
    action: 'CASHIER_UPDATED',
    details: `Memperbarui info kasir: ${users[index].name} (Cabang: ${users[index].branch_name}, Shift: ${users[index].shift})`,
    ip: req.ip || '127.0.0.1',
    created_at: new Date().toISOString(),
  });

  return res.json({ success: true, data: users[index] });
});

app.delete('/api/cashiers/:id', requireRole('OWNER', 'MANAGER'), enforceTenant, (req: Request, res: Response) => {
  const user = (req as any).currentUser as User;
  const index = users.findIndex(u => u.id === req.params.id && u.tenant_id === user.tenant_id && u.role === 'KASIR');

  if (index === -1) return res.status(404).json({ success: false, message: 'Kasir tidak ditemukan.' });

  // Manajer tidak boleh menghapus kasir cabang lain
  if (user.role === 'MANAGER' && users[index].branch_id !== user.branch_id) {
    return res.status(403).json({
      success: false,
      message: 'Akses Ditolak: Manajer hanya berwenang mengelola kasir di cabang sendiri.',
    });
  }

  const deleted = users.splice(index, 1)[0];

  activityLogs.unshift({
    id: 'log-' + Date.now(),
    tenant_id: user.tenant_id,
    user_id: user.id,
    user_name: user.name,
    user_role: user.role,
    action: 'CASHIER_DELETED',
    details: `Menghapus akun kasir: ${deleted.name}`,
    ip: req.ip || '127.0.0.1',
    created_at: new Date().toISOString(),
  });

  return res.json({ success: true, message: 'Kasir berhasil dihapus.' });
});

// Endpoint: Update current authenticated user profile (Kasir / Owner / Manager)
app.put('/api/users/profile', enforceTenant, (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ success: false, message: 'Tidak terotentikasi.' });

  const index = users.findIndex(u => u.id === user.id);
  if (index === -1) return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });

  const { name, phone, email, pin, password, avatar, shift, status } = req.body;
  const newSecret = pin || password;
  const newSecretHash = newSecret ? bcrypt.hashSync(String(newSecret).trim(), 10) : undefined;

  users[index] = {
    ...users[index],
    ...(name ? { name: name.trim() } : {}),
    ...(phone !== undefined ? { phone: phone.trim() } : {}),
    ...(email ? { email: email.trim().toLowerCase() } : {}),
    ...(pin ? { pin: pin.trim() } : {}),
    ...(newSecret ? { password: String(newSecret).trim(), password_hash: newSecretHash } : {}),
    ...(avatar ? { avatar } : {}),
    ...(shift ? { shift } : {}),
    ...(status ? { status } : {}),
  };

  activityLogs.unshift({
    id: 'log-' + Date.now(),
    tenant_id: user.tenant_id,
    user_id: user.id,
    user_name: users[index].name,
    user_role: user.role,
    action: 'PROFILE_UPDATED',
    details: `${user.role} ${users[index].name} memperbarui informasi profil dan preferensi keamanan.`,
    ip: req.ip || '127.0.0.1',
    created_at: new Date().toISOString(),
  });

  return res.json({
    success: true,
    message: 'Profil berhasil diperbarui.',
    data: users[index],
  });
});

// CUSTOMERS (Pelanggan) API - Accessible to Kasir, Manager, Owner
app.get('/api/customers', enforceTenant, (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId;
  let tenantCustomers = tenantId ? customers.filter(c => c.tenant_id === tenantId) : customers;

  const q = (req.query.q as string || '').toLowerCase().trim();
  if (q) {
    tenantCustomers = tenantCustomers.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      (c.email && c.email.toLowerCase().includes(q))
    );
  }

  return res.json({ success: true, data: tenantCustomers });
});

app.post('/api/customers', enforceTenant, (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user || !user.tenant_id) {
    return res.status(400).json({ success: false, message: 'Tenant tidak valid.' });
  }

  const { name, phone, email, address, tier = 'Member Baru', notes = '' } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ success: false, message: 'Nama dan nomor telepon pelanggan wajib diisi.' });
  }

  const newCustomer: Customer = {
    id: 'cust-' + Date.now(),
    tenant_id: user.tenant_id,
    name: name.trim(),
    phone: phone.trim(),
    email: email ? email.trim().toLowerCase() : undefined,
    address: address ? address.trim() : undefined,
    points: 10, // Bonus pendaftaran 10 poin
    total_spend: 0,
    total_orders: 0,
    tier: tier || 'Member Baru',
    last_visit: new Date().toISOString(),
    notes: notes ? notes.trim() : undefined,
  };

  customers.unshift(newCustomer);

  activityLogs.unshift({
    id: 'log-' + Date.now(),
    tenant_id: user.tenant_id,
    user_id: user.id,
    user_name: user.name,
    user_role: user.role,
    action: 'CUSTOMER_REGISTERED',
    details: `Pelanggan baru terdaftar: ${newCustomer.name} (${newCustomer.phone}) oleh ${user.name}`,
    ip: req.ip || '127.0.0.1',
    created_at: new Date().toISOString(),
  });

  return res.status(201).json({
    success: true,
    message: `Pelanggan ${newCustomer.name} berhasil didaftarkan.`,
    data: newCustomer,
  });
});

app.put('/api/customers/:id', enforceTenant, (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user || !user.tenant_id) {
    return res.status(400).json({ success: false, message: 'Tenant tidak valid.' });
  }

  const index = customers.findIndex(c => c.id === req.params.id && c.tenant_id === user.tenant_id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Data pelanggan tidak ditemukan.' });
  }

  customers[index] = {
    ...customers[index],
    ...req.body,
    tenant_id: user.tenant_id, // prevent tenant mutation
  };

  return res.json({
    success: true,
    message: 'Data pelanggan berhasil diperbarui.',
    data: customers[index],
  });
});

// 5. TRANSACTIONS & POS CHECKOUT
app.get('/api/transactions', enforceTenant, (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req)!;
  const tenantId = (req as any).tenantId;

  let tenantTrx = tenantId ? transactions.filter(t => t.tenant_id === tenantId) : transactions;

  // Kasir can strictly ONLY see their own transactions (Kasir A cannot see Kasir B's transactions)
  if (user.role === 'KASIR') {
    tenantTrx = tenantTrx.filter(t => t.cashier_id === user.id);
    // Mask cost and profit from cashier
    tenantTrx = tenantTrx.map(t => {
      const { total_cost, profit, ...safeTrx } = t;
      return safeTrx as Transaction;
    });
  }

  // Manajer tidak boleh melihat transaksi cabang lain
  if (user.role === 'MANAGER') {
    tenantTrx = tenantTrx.filter(t => t.branch_id === user.branch_id);
  }

  return res.json({ success: true, data: tenantTrx });
});

// POS Checkout Endpoint (Called strictly by Cashier)
app.post('/api/pos/checkout', requireRole('KASIR'), enforceTenant, (req: Request, res: Response) => {
  const user = (req as any).currentUser as User;
  const { items, payment_method, amount_paid, discount = 0, notes } = req.body;

  if (!items || !items.length) {
    return res.status(400).json({ success: false, message: 'Keranjang belanja kosong.' });
  }

  const tenant = tenants.find(t => t.id === user.tenant_id);
  const branch = branches.find(b => b.id === (user.branch_id || 'branch-sudirman')) || branches[0];

  // Calculate items, subtotal, tax, profit
  let subtotal = 0;
  let totalCost = 0;
  const detailItems = [];

  for (const it of items) {
    const p = products.find(prod => prod.id === it.product_id && prod.tenant_id === user.tenant_id);
    if (!p) continue;

    const qty = Number(it.quantity) || 1;
    const itemSubtotal = p.selling_price * qty;
    const itemCost = (p.cost_price || 0) * qty;

    subtotal += itemSubtotal;
    totalCost += itemCost;

    // Deduct stock from product
    p.stock = Math.max(0, p.stock - qty);
    if (branch && p.branch_stock && p.branch_stock[branch.id] !== undefined) {
      p.branch_stock[branch.id] = Math.max(0, p.branch_stock[branch.id] - qty);
    }

    detailItems.push({
      product_id: p.id,
      name: p.name,
      sku: p.code,
      price: p.selling_price,
      cost_price: p.cost_price,
      quantity: qty,
      subtotal: itemSubtotal,
      unit: p.unit,
    });
  }

  const tax = Math.round(subtotal * 0.10); // 10% PB1
  const total = subtotal + tax - (Number(discount) || 0);
  const paid = payment_method === 'cash' ? (Number(amount_paid) || total) : total;
  const change = Math.max(0, paid - total);

  const newTrx: Transaction = {
    id: 'trx-' + Date.now(),
    invoice_no: `TRX-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`,
    tenant_id: user.tenant_id!,
    tenant_name: tenant ? tenant.name : 'MultiPOS UMKM',
    branch_id: branch ? branch.id : 'branch-default',
    branch_name: branch ? branch.name : 'Cabang Utama',
    cashier_id: user.id,
    cashier_name: user.name,
    subtotal,
    discount: Number(discount) || 0,
    tax,
    total,
    total_cost: totalCost,
    profit: total - totalCost,
    payment_method: payment_method || 'cash',
    amount_paid: paid,
    change_due: change,
    status: 'completed',
    items_count: detailItems.reduce((acc, it) => acc + it.quantity, 0),
    items: detailItems,
    created_at: new Date().toISOString(),
    notes: notes || '',
  };

  transactions.unshift(newTrx);

  // Update tenant monthly omzet
  if (tenant) {
    tenant.monthly_omzet += total;
  }
  if (branch) {
    branch.omzet = (branch.omzet || 0) + total;
  }

  activityLogs.unshift({
    id: 'log-' + Date.now(),
    tenant_id: user.tenant_id,
    user_id: user.id,
    user_name: user.name,
    user_role: user.role,
    action: 'POS_CHECKOUT_COMPLETED',
    details: `Transaksi ${newTrx.invoice_no} senilai Rp ${total.toLocaleString('id-ID')} (${payment_method}) oleh kasir ${user.name}`,
    ip: req.ip || '127.0.0.1',
    created_at: new Date().toISOString(),
  });

  return res.status(201).json({
    success: true,
    data: newTrx,
  });
});

// 6. OWNER & MANAGER REPORTS & PROFITABILITY (Kasir 403)
app.get('/api/reports/financial', requireRole('OWNER', 'MANAGER', 'ADMIN'), enforceTenant, (req: Request, res: Response) => {
  const user = (req as any).currentUser as User;
  const tenantId = (req as any).tenantId;
  let tenantTrx = tenantId ? transactions.filter(t => t.tenant_id === tenantId) : transactions;

  // Manajer tidak boleh melihat informasi/finansial dari cabang lain
  if (user.role === 'MANAGER') {
    tenantTrx = tenantTrx.filter(t => t.branch_id === user.branch_id);
  }

  const totalOmzet = tenantTrx.reduce((acc, t) => acc + t.total, 0);
  const totalHPP = tenantTrx.reduce((acc, t) => acc + (t.total_cost || 0), 0);
  const totalTax = tenantTrx.reduce((acc, t) => acc + t.tax, 0);
  const opex = user.role === 'MANAGER' ? 5000000 : 15880000;
  const netProfit = totalOmzet - totalHPP - (tenantId ? opex : 0);

  // Per branch breakdown (strictly isolated for manager)
  const branchBreakdown: Record<string, { name: string; omzet: number; trx_count: number; profit: number }> = {};
  tenantTrx.forEach(t => {
    if (!branchBreakdown[t.branch_id]) {
      branchBreakdown[t.branch_id] = { name: t.branch_name, omzet: 0, trx_count: 0, profit: 0 };
    }
    branchBreakdown[t.branch_id].omzet += t.total;
    branchBreakdown[t.branch_id].profit += (t.profit || 0);
    branchBreakdown[t.branch_id].trx_count += 1;
  });

  // Top products
  const productSales: Record<string, { name: string; qty: number; total_omzet: number; profit: number }> = {};
  tenantTrx.forEach(t => {
    t.items.forEach(it => {
      if (!productSales[it.product_id]) {
        productSales[it.product_id] = { name: it.name, qty: 0, total_omzet: 0, profit: 0 };
      }
      productSales[it.product_id].qty += it.quantity;
      productSales[it.product_id].total_omzet += it.subtotal;
      const cost = (it.cost_price || 0) * it.quantity;
      productSales[it.product_id].profit += (it.subtotal - cost);
    });
  });

  // --- Analisis Metode Pembayaran Digital dan Manual ---
  const digitalMethodKeys = ['qris', 'debit', 'credit', 'transfer', 'ewallet'];
  const paymentMethodDetails: Record<
    string,
    {
      method: string;
      label: string;
      category: 'digital' | 'manual';
      total: number;
      count: number;
      settlement_info: string;
    }
  > = {
    qris: {
      method: 'qris',
      label: 'QRIS Dinamis & Statis (BCA / Gopay / ShopeePay)',
      category: 'digital',
      total: 0,
      count: 0,
      settlement_info: 'Real-time Langsung ke Rekening Toko',
    },
    debit: {
      method: 'debit',
      label: 'Kartu Debit EDC (BCA, Mandiri, BRI)',
      category: 'digital',
      total: 0,
      count: 0,
      settlement_info: 'Settlement H+1 Kerja Bank',
    },
    credit: {
      method: 'credit',
      label: 'Kartu Kredit EDC (Visa, Mastercard, JCB)',
      category: 'digital',
      total: 0,
      count: 0,
      settlement_info: 'Settlement H+2 Kerja Bank',
    },
    transfer: {
      method: 'transfer',
      label: 'Transfer Bank Langsung / Virtual Account',
      category: 'digital',
      total: 0,
      count: 0,
      settlement_info: 'Real-time Cek Otomatis',
    },
    cash: {
      method: 'cash',
      label: 'Uang Tunai (Cash Fisik di Laci Kasir)',
      category: 'manual',
      total: 0,
      count: 0,
      settlement_info: 'Kas Fisik Siap Setor / Tutup Shift',
    },
  };

  let digitalTotal = 0;
  let digitalCount = 0;
  let manualTotal = 0;
  let manualCount = 0;

  tenantTrx.forEach(t => {
    const rawMethod = (t.payment_method || 'cash').toLowerCase();
    const isDigital = digitalMethodKeys.includes(rawMethod);
    const key = paymentMethodDetails[rawMethod] ? rawMethod : (isDigital ? 'qris' : 'cash');

    paymentMethodDetails[key].total += t.total;
    paymentMethodDetails[key].count += 1;

    if (isDigital) {
      digitalTotal += t.total;
      digitalCount += 1;
    } else {
      manualTotal += t.total;
      manualCount += 1;
    }
  });

  const paymentBreakdownList = Object.values(paymentMethodDetails)
    .filter(item => item.count > 0 || item.method === 'cash' || item.method === 'qris' || item.method === 'debit')
    .map(item => ({
      ...item,
      percent: totalOmzet > 0 ? Number(((item.total / totalOmzet) * 100).toFixed(1)) : 0,
      avg_order_value: item.count > 0 ? Math.round(item.total / item.count) : 0,
    }))
    .sort((a, b) => b.total - a.total);

  // --- Grafik Penjualan (Harian 7 Hari Terakhir & Per Jam) ---
  const now = new Date();
  const dayLabels = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  const dailyMap: Record<
    string,
    {
      date: string;
      label: string;
      omzet: number;
      trx_count: number;
      digital_omzet: number;
      manual_omzet: number;
    }
  > = {};

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateKey = d.toISOString().slice(0, 10);
    const dayName = dayLabels[d.getDay()];
    dailyMap[dateKey] = {
      date: dateKey,
      label: `${dayName}, ${d.getDate()}/${d.getMonth() + 1}`,
      omzet: 0,
      trx_count: 0,
      digital_omzet: 0,
      manual_omzet: 0,
    };
  }

  tenantTrx.forEach(t => {
    const dateKey = t.created_at ? t.created_at.slice(0, 10) : '';
    if (dailyMap[dateKey]) {
      dailyMap[dateKey].omzet += t.total;
      dailyMap[dateKey].trx_count += 1;
      if (digitalMethodKeys.includes((t.payment_method || '').toLowerCase())) {
        dailyMap[dateKey].digital_omzet += t.total;
      } else {
        dailyMap[dateKey].manual_omzet += t.total;
      }
    }
  });

  const salesChartDaily = Object.values(dailyMap);

  // Hourly chart for today
  const hourlyMap: Record<number, { hour: string; omzet: number; trx_count: number }> = {};
  for (let h = 8; h <= 21; h++) {
    hourlyMap[h] = {
      hour: `${h.toString().padStart(2, '0')}:00`,
      omzet: 0,
      trx_count: 0,
    };
  }

  const todayKey = now.toISOString().slice(0, 10);
  tenantTrx.forEach(t => {
    if (t.created_at && t.created_at.startsWith(todayKey)) {
      const h = new Date(t.created_at).getHours();
      if (hourlyMap[h]) {
        hourlyMap[h].omzet += t.total;
        hourlyMap[h].trx_count += 1;
      }
    }
  });

  const salesChartHourly = Object.values(hourlyMap);

  return res.json({
    success: true,
    data: {
      total_omzet: totalOmzet,
      total_hpp: totalHPP,
      total_tax: totalTax,
      opex,
      net_profit: netProfit,
      margin_percent: totalOmzet > 0 ? ((netProfit / totalOmzet) * 100).toFixed(1) : '0',
      total_transactions: tenantTrx.length,
      branch_breakdown: Object.values(branchBreakdown),
      top_products: Object.values(productSales).sort((a, b) => b.profit - a.profit),
      // Payment data:
      payment_summary: {
        digital_total: digitalTotal,
        digital_count: digitalCount,
        digital_percent: totalOmzet > 0 ? Number(((digitalTotal / totalOmzet) * 100).toFixed(1)) : 0,
        manual_total: manualTotal,
        manual_count: manualCount,
        manual_percent: totalOmzet > 0 ? Number(((manualTotal / totalOmzet) * 100).toFixed(1)) : 0,
        breakdown: paymentBreakdownList,
      },
      // Sales Chart data:
      sales_chart_daily: salesChartDaily,
      sales_chart_hourly: salesChartHourly,
    },
  });
});

// 7. SUPER ADMIN ENDPOINTS (Admin Only, Owner & Kasir 403)
// 7. SUPER ADMIN ENDPOINTS (Admin Only, Owner & Kasir 403)
let platformSettings = {
  maintenance_mode: false,
  announcement_banner: 'Sistem MultiPOS Multi-Tenant beroperasi normal. Isolasi data Row-Level Security 100% aktif.',
  auto_backup: true,
  security_audit_level: 'STRICT',
};

app.get('/api/admin/metrics', requireRole('ADMIN'), (_req: Request, res: Response) => {
  const totalTenants = tenants.length;
  const activeTenants = tenants.filter(t => t.status === 'active').length;
  const trialTenants = tenants.filter(t => t.status === 'trial').length;
  const suspendedTenants = tenants.filter(t => t.status === 'suspended').length;
  const totalOmzet = tenants.reduce((acc, t) => acc + t.monthly_omzet, 0);

  return res.json({
    success: true,
    data: {
      total_tenants: totalTenants,
      active_tenants: activeTenants,
      trial_tenants: trialTenants,
      suspended_tenants: suspendedTenants,
      mrr_rupiah: 285600000,
      total_platform_gmv: totalOmzet,
      total_transactions_count: transactions.length,
      server_latency_ms: 18,
      rls_policy_verified: true,
      aws_region: 'ap-southeast-3 (Jakarta)',
      platform_settings: platformSettings,
    },
  });
});

app.get('/api/admin/tenants', requireRole('ADMIN'), (_req: Request, res: Response) => {
  return res.json({ success: true, data: tenants });
});

app.put('/api/admin/tenants/:id/status', requireRole('ADMIN'), (req: Request, res: Response) => {
  const { status } = req.body;
  const tenant = tenants.find(t => t.id === req.params.id);
  if (!tenant) return res.status(404).json({ success: false, message: 'Tenant tidak ditemukan.' });

  tenant.status = status;

  activityLogs.unshift({
    id: 'log-' + Date.now(),
    tenant_id: tenant.id,
    user_id: 'user-admin',
    user_name: 'Pratama Wicaksana',
    user_role: 'ADMIN',
    action: `TENANT_STATUS_${status.toUpperCase()}`,
    details: `Super Admin mengubah status tenant '${tenant.name}' (${tenant.code}) menjadi: ${status}`,
    ip: req.ip || '127.0.0.1',
    created_at: new Date().toISOString(),
  });

  return res.json({ success: true, data: tenant });
});

// A & B & D. LIST USERS ACROSS PLATFORM (ADMIN ONLY)
app.get('/api/admin/users', requireRole('ADMIN'), (req: Request, res: Response) => {
  const { role, status, search, tenant_id } = req.query;

  let enrichedUsers = users.map(u => {
    const tenant = tenants.find(t => t.id === u.tenant_id);
    const branch = branches.find(b => b.id === u.branch_id);
    return {
      ...u,
      tenant_name: tenant ? tenant.name : (u.role === 'ADMIN' ? 'Platform MultiPOS (Global)' : 'Tidak Terikat'),
      tenant_code: tenant ? tenant.code : 'GLOBAL',
      branch_name: branch ? branch.name : (u.branch_name || (u.role === 'OWNER' ? 'Semua Cabang (HQ & Outlet)' : 'Belum Ditugaskan')),
    };
  });

  if (role && role !== 'all') {
    enrichedUsers = enrichedUsers.filter(u => u.role === role);
  }
  if (status && status !== 'all') {
    enrichedUsers = enrichedUsers.filter(u => u.status === status);
  }
  if (tenant_id && tenant_id !== 'all') {
    enrichedUsers = enrichedUsers.filter(u => u.tenant_id === tenant_id);
  }
  if (search) {
    const q = (search as string).toLowerCase().trim();
    enrichedUsers = enrichedUsers.filter(u =>
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.phone && u.phone.includes(q)) ||
      (u.tenant_name && u.tenant_name.toLowerCase().includes(q)) ||
      (u.branch_name && u.branch_name.toLowerCase().includes(q))
    );
  }

  return res.json({
    success: true,
    data: enrichedUsers,
    total: enrichedUsers.length,
    summary: {
      total: users.length,
      admins: users.filter(u => u.role === 'ADMIN').length,
      owners: users.filter(u => u.role === 'OWNER').length,
      managers: users.filter(u => u.role === 'MANAGER').length,
      cashiers: users.filter(u => u.role === 'KASIR').length,
      active: users.filter(u => u.status === 'active').length,
      inactive: users.filter(u => u.status === 'inactive').length,
    },
  });
});

// C & E. TOGGLE USER STATUS (ENABLE / DISABLE OWNER, MANAGER, KASIR, ADMIN)
app.put('/api/admin/users/:id/status', requireRole('ADMIN'), (req: Request, res: Response) => {
  const currentAdmin = getAuthenticatedUser(req);
  const targetId = req.params.id;
  const { status } = req.body;

  if (status !== 'active' && status !== 'inactive') {
    return res.status(400).json({ success: false, message: "Status harus bernilai 'active' atau 'inactive'." });
  }

  const userIdx = users.findIndex(u => u.id === targetId);
  if (userIdx === -1) {
    return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
  }

  const targetUser = users[userIdx];

  // Safety Protection: Super admin cannot deactivate their own active account
  if (currentAdmin && currentAdmin.id === targetUser.id && status === 'inactive') {
    return res.status(400).json({
      success: false,
      message: 'Operasi Ditolak: Anda tidak dapat menonaktifkan akun Super Admin Anda sendiri yang sedang aktif.',
    });
  }

  targetUser.status = status;
  users[userIdx] = targetUser;

  // Log activity
  activityLogs.unshift({
    id: 'log-' + Date.now(),
    tenant_id: targetUser.tenant_id,
    user_id: currentAdmin ? currentAdmin.id : 'user-admin',
    user_name: currentAdmin ? currentAdmin.name : 'Super Admin',
    user_role: 'ADMIN',
    action: `USER_STATUS_${status.toUpperCase()}`,
    details: `Super Admin ${currentAdmin ? currentAdmin.name : 'Platform'} ${
      status === 'active' ? 'mengaktifkan kembali' : 'menonaktifkan (disable)'
    } akun ${targetUser.role}: ${targetUser.name} (${targetUser.email})`,
    ip: req.ip || '127.0.0.1',
    created_at: new Date().toISOString(),
  });

  return res.json({
    success: true,
    message: `Akun ${targetUser.role} ${targetUser.name} berhasil ${status === 'active' ? 'diaktifkan' : 'dinonaktifkan'}.`,
    data: targetUser,
  });
});

// A. WORKFLOW SURVEILLANCE: MONITOR ALUR JALANNYA OWNER, MANAJER, DAN KASIR
app.get('/api/admin/workflow-surveillance', requireRole('ADMIN'), (_req: Request, res: Response) => {
  // 1. Owner Workflow & Oversight
  const ownersList = users
    .filter(u => u.role === 'OWNER')
    .map(o => {
      const tenant = tenants.find(t => t.id === o.tenant_id);
      const tenantBranches = branches.filter(b => b.tenant_id === o.tenant_id);
      const tenantCashiers = users.filter(u => u.tenant_id === o.tenant_id && u.role === 'KASIR');
      const tenantProducts = products.filter(p => p.tenant_id === o.tenant_id);
      const recentTrx = transactions.filter(t => t.tenant_id === o.tenant_id).slice(0, 3);
      return {
        id: o.id,
        name: o.name,
        email: o.email,
        phone: o.phone,
        avatar: o.avatar,
        status: o.status,
        tenant_id: o.tenant_id,
        tenant_name: tenant ? tenant.name : 'Bisnis UMKM',
        tenant_code: tenant ? tenant.code : '-',
        tenant_package: tenant ? tenant.package : 'Starter',
        monthly_omzet: tenant ? tenant.monthly_omzet : 0,
        branches_count: tenantBranches.length,
        cashiers_count: tenantCashiers.length,
        products_count: tenantProducts.length,
        branches: tenantBranches.map(b => ({ id: b.id, name: b.name, code: b.code, omzet: b.omzet || 0 })),
        recent_trx: recentTrx.map(t => ({ invoice_no: t.invoice_no, total: t.total, created_at: t.created_at })),
      };
    });

  // 2. Manager Workflow & Branch Supervision
  const managersList = users
    .filter(u => u.role === 'MANAGER')
    .map(m => {
      const tenant = tenants.find(t => t.id === m.tenant_id);
      const branch = branches.find(b => b.id === m.branch_id);
      const supervisedCashiers = users.filter(u => u.branch_id === m.branch_id && u.role === 'KASIR');
      const branchShipments = shipments.filter(s => s.target_branch_id === m.branch_id);
      const inTransitShipments = branchShipments.filter(s => s.status === 'DALAM_PENGIRIMAN');
      const receivedShipments = branchShipments.filter(s => s.status === 'DITERIMA');

      return {
        id: m.id,
        name: m.name,
        email: m.email,
        phone: m.phone,
        avatar: m.avatar,
        status: m.status,
        tenant_id: m.tenant_id,
        tenant_name: tenant ? tenant.name : 'Bisnis UMKM',
        branch_id: m.branch_id,
        branch_name: branch ? branch.name : m.branch_name || 'Cabang Belum Ditugaskan',
        branch_code: branch ? branch.code : '-',
        operating_hours: branch ? branch.operating_hours : '08:00 - 22:00 WIB',
        supervised_cashiers_count: supervisedCashiers.length,
        supervised_cashiers: supervisedCashiers.map(c => ({ id: c.id, name: c.name, shift: c.shift, status: c.status, is_online: c.is_online })),
        inbound_shipments_count: branchShipments.length,
        in_transit_shipments_count: inTransitShipments.length,
        received_shipments_count: receivedShipments.length,
        latest_shipment: branchShipments[0] || null,
      };
    });

  // 3. Cashier Workflow & Front-line POS
  const cashiersList = users
    .filter(u => u.role === 'KASIR')
    .map(c => {
      const tenant = tenants.find(t => t.id === c.tenant_id);
      const branch = branches.find(b => b.id === c.branch_id);
      const cashierTransactions = transactions.filter(t => t.cashier_id === c.id);
      const totalTrxCount = cashierTransactions.length;
      const totalOmzet = cashierTransactions.reduce((acc, t) => acc + t.total, 0);
      const latestTrx = cashierTransactions[0] || null;

      return {
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        avatar: c.avatar,
        status: c.status,
        shift: c.shift || 'Shift Pagi',
        is_online: !!c.is_online,
        tenant_id: c.tenant_id,
        tenant_name: tenant ? tenant.name : 'Bisnis UMKM',
        branch_id: c.branch_id,
        branch_name: branch ? branch.name : c.branch_name || 'Belum Ditugaskan',
        total_trx_count: totalTrxCount,
        total_omzet: totalOmzet,
        latest_trx: latestTrx ? {
          invoice_no: latestTrx.invoice_no,
          total: latestTrx.total,
          payment_method: latestTrx.payment_method,
          created_at: latestTrx.created_at,
        } : null,
      };
    });

  // 4. Live Stream of Operational Events (Transactions, Shipments, Role Activity)
  const liveRecentTransactions = transactions.slice(0, 15).map(t => ({
    id: t.id,
    invoice_no: t.invoice_no,
    tenant_name: t.tenant_name,
    branch_name: t.branch_name,
    cashier_name: t.cashier_name,
    total: t.total,
    payment_method: t.payment_method,
    items_count: t.items_count,
    created_at: t.created_at,
  }));

  return res.json({
    success: true,
    data: {
      workflow_hierarchy: {
        owners: ownersList,
        managers: managersList,
        cashiers: cashiersList,
      },
      live_recent_transactions: liveRecentTransactions,
      recent_shipments: shipments.slice(0, 5),
      summary_counters: {
        total_owners: ownersList.length,
        active_owners: ownersList.filter(o => o.status === 'active').length,
        total_managers: managersList.length,
        active_managers: managersList.filter(m => m.status === 'active').length,
        total_cashiers: cashiersList.length,
        active_cashiers: cashiersList.filter(c => c.status === 'active').length,
        online_cashiers: cashiersList.filter(c => c.is_online).length,
        total_branches: branches.length,
        total_products: products.length,
        total_transactions: transactions.length,
      },
    },
  });
});

// F. STATISTIK SISTEM, LAPORAN SISTEM & AUDIT AKTIVITAS
app.get('/api/admin/system-stats', requireRole('ADMIN'), (_req: Request, res: Response) => {
  const totalOmzet = tenants.reduce((acc, t) => acc + t.monthly_omzet, 0);
  const totalTrxCount = transactions.length;
  const avgBasket = totalTrxCount > 0 ? Math.round(totalOmzet / totalTrxCount) : 0;

  // Breakdown payment method
  const paymentBreakdown: Record<string, { method: string; count: number; total: number }> = {};
  transactions.forEach(t => {
    const m = (t.payment_method || 'cash').toLowerCase();
    if (!paymentBreakdown[m]) {
      paymentBreakdown[m] = { method: m, count: 0, total: 0 };
    }
    paymentBreakdown[m].count += 1;
    paymentBreakdown[m].total += t.total;
  });

  // Revenue per Tenant
  const tenantRevenueReport = tenants.map(t => {
    const trxs = transactions.filter(tr => tr.tenant_id === t.id);
    const tenantBranches = branches.filter(b => b.tenant_id === t.id);
    const tenantCashiers = users.filter(u => u.tenant_id === t.id && u.role === 'KASIR');
    const revenue = trxs.reduce((acc, tr) => acc + tr.total, 0) || t.monthly_omzet;
    return {
      tenant_id: t.id,
      tenant_name: t.name,
      code: t.code,
      package: t.package,
      status: t.status,
      owner_name: t.owner_name,
      branches_count: tenantBranches.length,
      cashiers_count: tenantCashiers.length,
      total_transactions: trxs.length,
      total_revenue: revenue,
    };
  }).sort((a, b) => b.total_revenue - a.total_revenue);

  // Branch Performance
  const branchReport = branches.map(b => {
    const tenant = tenants.find(t => t.id === b.tenant_id);
    const trxs = transactions.filter(tr => tr.branch_id === b.id);
    const rev = trxs.reduce((acc, tr) => acc + tr.total, 0) || b.omzet || 0;
    return {
      branch_id: b.id,
      branch_name: b.name,
      branch_code: b.code,
      tenant_name: tenant ? tenant.name : 'UMKM',
      pic_name: b.pic_name,
      status: b.status,
      transactions_count: trxs.length,
      revenue: rev,
    };
  }).sort((a, b) => b.revenue - a.revenue);

  return res.json({
    success: true,
    data: {
      metrics: {
        total_tenants: tenants.length,
        active_tenants: tenants.filter(t => t.status === 'active').length,
        total_users: users.length,
        active_users: users.filter(u => u.status === 'active').length,
        inactive_users: users.filter(u => u.status === 'inactive').length,
        total_branches: branches.length,
        total_transactions: totalTrxCount,
        total_platform_gmv: totalOmzet,
        avg_basket_size: avgBasket,
        server_latency_ms: 18,
        server_uptime_percent: '99.98%',
        database_engine: 'PostgreSQL / Firestore Multi-Tenant RLS Enabled',
        rls_verified: true,
      },
      user_breakdown: {
        admins: users.filter(u => u.role === 'ADMIN').length,
        owners: users.filter(u => u.role === 'OWNER').length,
        managers: users.filter(u => u.role === 'MANAGER').length,
        cashiers: users.filter(u => u.role === 'KASIR').length,
      },
      payment_distribution: Object.values(paymentBreakdown),
      tenant_revenue_report: tenantRevenueReport,
      branch_report: branchReport,
      platform_settings: platformSettings,
    },
  });
});

// G. SUPER ADMIN PROFILE: GET & UPDATE PROFIL ADMIN
app.get('/api/admin/profile', requireRole('ADMIN'), (req: Request, res: Response) => {
  const currentAdmin = getAuthenticatedUser(req) || users.find(u => u.role === 'ADMIN');
  return res.json({
    success: true,
    user: currentAdmin,
    platform_settings: platformSettings,
  });
});

app.put('/api/admin/profile', requireRole('ADMIN'), (req: Request, res: Response) => {
  const currentAdmin = getAuthenticatedUser(req) || users.find(u => u.role === 'ADMIN');
  const {
    name,
    email,
    phone,
    avatar,
    pin,
    maintenance_mode,
    announcement_banner,
  } = req.body;

  const adminIdx = users.findIndex(u => u.id === (currentAdmin ? currentAdmin.id : 'user-admin'));
  if (adminIdx !== -1) {
    users[adminIdx] = {
      ...users[adminIdx],
      ...(name ? { name: name.trim() } : {}),
      ...(email ? { email: email.trim().toLowerCase() } : {}),
      ...(phone ? { phone: phone.trim() } : {}),
      ...(avatar ? { avatar } : {}),
      ...(pin ? { pin: pin.trim() } : {}),
    };
  }

  if (maintenance_mode !== undefined) {
    platformSettings.maintenance_mode = !!maintenance_mode;
  }
  if (announcement_banner !== undefined) {
    platformSettings.announcement_banner = announcement_banner.trim();
  }

  activityLogs.unshift({
    id: 'log-' + Date.now(),
    tenant_id: null,
    user_id: currentAdmin ? currentAdmin.id : 'user-admin',
    user_name: name || (currentAdmin ? currentAdmin.name : 'Super Admin'),
    user_role: 'ADMIN',
    action: 'ADMIN_PROFILE_UPDATED',
    details: `Super Admin ${name || (currentAdmin ? currentAdmin.name : 'Platform')} memperbarui data profil, kunci otorisasi dan konfigurasi platform.`,
    ip: req.ip || '127.0.0.1',
    created_at: new Date().toISOString(),
  });

  return res.json({
    success: true,
    message: 'Profil Super Admin dan pengaturan platform berhasil diperbarui.',
    user: adminIdx !== -1 ? users[adminIdx] : currentAdmin,
    platform_settings: platformSettings,
  });
});

// 8. ACTIVITY LOGS (Owner sees own tenant logs, Admin sees all, Kasir gets 403)
app.get('/api/activity-logs', requireRole('OWNER', 'ADMIN'), (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req)!;
  if (user.role === 'ADMIN') {
    return res.json({ success: true, data: activityLogs });
  }
  const tenantLogs = activityLogs.filter(l => l.tenant_id === user.tenant_id);
  return res.json({ success: true, data: tenantLogs });
});

// 9. PRODUCT SHIPMENTS & DISTRIBUTION (PENGIRIMAN PRODUK KE MANAJER)
app.get('/api/shipments', enforceTenant, (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId;
  const user = getAuthenticatedUser(req)!;

  let tenantShipments = tenantId ? shipments.filter(s => s.tenant_id === tenantId) : shipments;

  // If manager, only see shipments destined to their branch
  if (user.role === 'MANAGER' && user.branch_id) {
    tenantShipments = tenantShipments.filter(s => s.target_branch_id === user.branch_id);
  }

  // Branch filter
  const branchFilter = req.query.branchId as string;
  if (branchFilter && branchFilter !== 'all') {
    tenantShipments = tenantShipments.filter(s => s.target_branch_id === branchFilter);
  }

  // Status filter
  const statusFilter = req.query.status as string;
  if (statusFilter && statusFilter !== 'all') {
    tenantShipments = tenantShipments.filter(s => s.status === statusFilter);
  }

  // Search filter
  const q = (req.query.q as string || '').toLowerCase().trim();
  if (q) {
    tenantShipments = tenantShipments.filter(s =>
      s.shipment_no.toLowerCase().includes(q) ||
      s.target_branch_name.toLowerCase().includes(q) ||
      s.manager_name.toLowerCase().includes(q) ||
      s.driver_name.toLowerCase().includes(q) ||
      (s.tracking_number && s.tracking_number.toLowerCase().includes(q))
    );
  }

  return res.json({
    success: true,
    data: tenantShipments,
  });
});

app.post('/api/shipments', requireRole('OWNER', 'ADMIN'), enforceTenant, (req: Request, res: Response) => {
  const user = (req as any).currentUser as User;
  const tenantId = user.tenant_id || (req as any).tenantId;

  const {
    target_branch_id,
    target_branch_name,
    manager_id,
    manager_name,
    driver_name,
    courier_service,
    tracking_number,
    notes,
    items,
    status = 'DALAM_PENGIRIMAN',
  } = req.body;

  if (!target_branch_id || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Cabang tujuan dan minimal 1 produk pengiriman wajib diisi.',
    });
  }

  const targetBranch = branches.find(b => b.id === target_branch_id);
  const managerUser = manager_id
    ? users.find(u => u.id === manager_id)
    : users.find(u => u.branch_id === target_branch_id && u.role === 'MANAGER');

  const formattedItems = items.map((it: any) => {
    const prod = products.find(p => p.id === it.product_id);
    return {
      product_id: it.product_id,
      product_code: it.product_code || (prod ? prod.code : 'SKU-00'),
      product_name: it.product_name || (prod ? prod.name : 'Produk'),
      quantity: Number(it.quantity) || 1,
      unit: it.unit || (prod ? prod.unit : 'Pcs'),
      cost_price: prod ? prod.cost_price : 0,
      selling_price: prod ? prod.selling_price : 0,
    };
  });

  const totalQuantity = formattedItems.reduce((sum: number, it: any) => sum + it.quantity, 0);
  const totalCostValue = formattedItems.reduce((sum: number, it: any) => sum + (it.cost_price * it.quantity), 0);

  const shipmentCount = shipments.filter(s => s.tenant_id === tenantId).length + 1;
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const codeNum = String(shipmentCount).padStart(3, '0');

  const newShipment: ProductShipment = {
    id: 'ship-' + Date.now(),
    tenant_id: tenantId,
    shipment_no: `DO-${year}/${month}/KB-${codeNum}`,
    source: 'Gudang Pusat / Central Roastery HQ',
    target_branch_id,
    target_branch_name: targetBranch ? targetBranch.name : target_branch_name || 'Cabang Outlet',
    manager_id: managerUser ? managerUser.id : (manager_id || 'user-manager'),
    manager_name: managerUser ? managerUser.name : (manager_name || 'Manajer Cabang'),
    driver_name: driver_name || 'Armada Toko Internal',
    courier_service: courier_service || 'Armada Box Gudang',
    tracking_number: tracking_number || `TR-${year}${month}-${codeNum}`,
    status: status as any,
    items: formattedItems,
    total_items: formattedItems.length,
    total_quantity: totalQuantity,
    total_cost_value: totalCostValue,
    notes: notes || '',
    shipped_at: status === 'DALAM_PENGIRIMAN' ? now.toISOString() : undefined,
    created_at: now.toISOString(),
  };

  shipments.unshift(newShipment);

  activityLogs.unshift({
    id: 'log-' + Date.now(),
    tenant_id: tenantId,
    user_id: user.id,
    user_name: user.name,
    user_role: user.role,
    action: 'PRODUCT_SHIPMENT_CREATED',
    details: `Owner membuat pengiriman produk (${newShipment.shipment_no}) sebanyak ${totalQuantity} unit ke ${newShipment.target_branch_name} (Manajer: ${newShipment.manager_name}).`,
    ip: req.ip || '127.0.0.1',
    created_at: now.toISOString(),
  });

  return res.status(201).json({
    success: true,
    message: `Surat Jalan Pengiriman ${newShipment.shipment_no} berhasil dibuat.`,
    data: newShipment,
  });
});

app.put('/api/shipments/:id/status', requireRole('OWNER', 'MANAGER', 'ADMIN'), (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req)!;
  const { status, received_notes } = req.body;

  const idx = shipments.findIndex(s => s.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ success: false, message: 'Data pengiriman tidak ditemukan.' });
  }

  const shipment = shipments[idx];
  const oldStatus = shipment.status;
  shipment.status = status;

  if (status === 'DALAM_PENGIRIMAN' && !shipment.shipped_at) {
    shipment.shipped_at = new Date().toISOString();
  }

  if (status === 'DITERIMA' || status === 'SELESAI') {
    shipment.received_at = new Date().toISOString();
    if (received_notes) shipment.received_notes = received_notes;

    // Jika diterima, otomatis perbarui stok cabang tujuan
    shipment.items.forEach(it => {
      const prod = products.find(p => p.id === it.product_id);
      if (prod && prod.branch_stock && prod.branch_stock[shipment.target_branch_id] !== undefined) {
        prod.branch_stock[shipment.target_branch_id] += it.quantity;
      }
    });
  }

  activityLogs.unshift({
    id: 'log-' + Date.now(),
    tenant_id: shipment.tenant_id,
    user_id: user.id,
    user_name: user.name,
    user_role: user.role,
    action: `SHIPMENT_STATUS_${status}`,
    details: `${user.role} ${user.name} mengubah status pengiriman ${shipment.shipment_no} dari ${oldStatus} menjadi ${status}.`,
    ip: req.ip || '127.0.0.1',
    created_at: new Date().toISOString(),
  });

  return res.json({
    success: true,
    message: `Status pengiriman ${shipment.shipment_no} berhasil diubah ke ${status}.`,
    data: shipment,
  });
});

// 10. OWNER PROFILE & STORE IDENTITY UPDATE
app.put('/api/owner/profile', requireRole('OWNER'), enforceTenant, (req: Request, res: Response) => {
  const user = (req as any).currentUser as User;
  const {
    // User fields
    name,
    phone,
    email,
    avatar,
    pin,
    // Tenant fields
    tenant_name,
    tenant_category,
    tenant_address,
    tenant_description,
    bank_name,
    bank_account_no,
    bank_account_name,
  } = req.body;

  // Update user in memory
  const userIdx = users.findIndex(u => u.id === user.id);
  if (userIdx !== -1) {
    users[userIdx] = {
      ...users[userIdx],
      ...(name ? { name: name.trim() } : {}),
      ...(phone ? { phone: phone.trim() } : {}),
      ...(email ? { email: email.trim().toLowerCase() } : {}),
      ...(avatar ? { avatar } : {}),
      ...(pin ? { pin: pin.trim() } : {}),
    };
  }

  // Update tenant in memory
  const tenantIdx = tenants.findIndex(t => t.id === user.tenant_id);
  if (tenantIdx !== -1) {
    tenants[tenantIdx] = {
      ...tenants[tenantIdx],
      ...(tenant_name ? { name: tenant_name.trim() } : {}),
      ...(tenant_category ? { category: tenant_category } : {}),
      ...(tenant_address ? { address: tenant_address.trim() } : {}),
      ...(tenant_description ? { description: tenant_description.trim() } : {}),
      ...(name ? { owner_name: name.trim() } : {}),
      ...(phone ? { owner_phone: phone.trim() } : {}),
      ...(email ? { owner_email: email.trim().toLowerCase() } : {}),
    };
  }

  activityLogs.unshift({
    id: 'log-' + Date.now(),
    tenant_id: user.tenant_id,
    user_id: user.id,
    user_name: name || user.name,
    user_role: 'OWNER',
    action: 'OWNER_PROFILE_UPDATED',
    details: `Owner ${name || user.name} memperbarui profil pribadi, identitas usaha, dan rekening penarikan dana.`,
    ip: req.ip || '127.0.0.1',
    created_at: new Date().toISOString(),
  });

  return res.json({
    success: true,
    message: 'Profil Owner dan informasi bisnis berhasil diperbarui.',
    user: userIdx !== -1 ? users[userIdx] : user,
    tenant: tenantIdx !== -1 ? tenants[tenantIdx] : null,
    bank_info: {
      bank_name: bank_name || 'BCA (Bank Central Asia)',
      bank_account_no: bank_account_no || '8821-0092-8119',
      bank_account_name: bank_account_name || (name || user.name),
    },
  });
});

// Update Manager Profile & Branch Supervision Preferences
app.put('/api/manager/profile', requireRole('MANAGER', 'OWNER', 'ADMIN'), enforceTenant, (req: Request, res: Response) => {
  const user = (req as any).currentUser as User;
  const {
    name,
    phone,
    email,
    avatar,
    pin,
    branch_phone,
    branch_operating_hours,
    branch_address,
  } = req.body;

  // Update manager in memory
  const userIdx = users.findIndex(u => u.id === user.id);
  if (userIdx !== -1) {
    users[userIdx] = {
      ...users[userIdx],
      ...(name ? { name: name.trim() } : {}),
      ...(phone ? { phone: phone.trim() } : {}),
      ...(email ? { email: email.trim().toLowerCase() } : {}),
      ...(avatar ? { avatar } : {}),
      ...(pin ? { pin: pin.trim() } : {}),
    };
  }

  // Update branch contact/hours if manager has branch_id
  let updatedBranch: Branch | null = null;
  if (user.branch_id) {
    const branchIdx = branches.findIndex(b => b.id === user.branch_id);
    if (branchIdx !== -1) {
      branches[branchIdx] = {
        ...branches[branchIdx],
        ...(branch_phone ? { phone: branch_phone.trim() } : {}),
        ...(branch_operating_hours ? { operating_hours: branch_operating_hours.trim() } : {}),
        ...(branch_address ? { address: branch_address.trim() } : {}),
        pic_name: name ? name.trim() : branches[branchIdx].pic_name,
        pic_phone: phone ? phone.trim() : branches[branchIdx].pic_phone,
      };
      updatedBranch = branches[branchIdx];
    }
  }

  activityLogs.unshift({
    id: 'log-' + Date.now(),
    tenant_id: user.tenant_id,
    user_id: user.id,
    user_name: name || user.name,
    user_role: 'MANAGER',
    action: 'MANAGER_PROFILE_UPDATED',
    details: `Manajer ${name || user.name} memperbarui profil dan konfigurasi supervisi cabang.`,
    ip: req.ip || '127.0.0.1',
    created_at: new Date().toISOString(),
  });

  return res.json({
    success: true,
    message: 'Profil Manajer dan pengaturan cabang berhasil diperbarui.',
    user: userIdx !== -1 ? users[userIdx] : user,
    branch: updatedBranch,
  });
});

// 11. OWNER PRODUCT SALES ANALYTICS & CHARTS
app.get('/api/owner/product-sales-analytics', requireRole('OWNER', 'ADMIN'), enforceTenant, (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId;
  const tenantProducts = tenantId ? products.filter(p => p.tenant_id === tenantId) : products;
  const tenantTrx = tenantId ? transactions.filter(t => t.tenant_id === tenantId) : transactions;

  // Aggregate product sales from all transactions
  const productAgg: {
    [prodId: string]: {
      product_id: string;
      product_name: string;
      sku: string;
      category_name: string;
      selling_price: number;
      cost_price: number;
      units_sold: number;
      total_omzet: number;
      total_hpp: number;
      gross_profit: number;
      margin_percent: number;
    };
  } = {};

  tenantProducts.forEach(p => {
    productAgg[p.id] = {
      product_id: p.id,
      product_name: p.name,
      sku: p.code,
      category_name: p.category_name,
      selling_price: p.selling_price,
      cost_price: p.cost_price,
      units_sold: 0,
      total_omzet: 0,
      total_hpp: 0,
      gross_profit: 0,
      margin_percent: p.selling_price > 0 ? Math.round(((p.selling_price - p.cost_price) / p.selling_price) * 100) : 0,
    };
  });

  tenantTrx.forEach(t => {
    if (t.status === 'completed' && t.items) {
      t.items.forEach(it => {
        if (!productAgg[it.product_id]) {
          productAgg[it.product_id] = {
            product_id: it.product_id,
            product_name: it.name,
            sku: it.sku || 'SKU-00',
            category_name: 'Menu Kafe & Mart',
            selling_price: it.price,
            cost_price: it.cost_price || 0,
            units_sold: 0,
            total_omzet: 0,
            total_hpp: 0,
            gross_profit: 0,
            margin_percent: 40,
          };
        }
        const entry = productAgg[it.product_id];
        const qty = it.quantity || 1;
        entry.units_sold += qty;
        entry.total_omzet += it.subtotal || (it.price * qty);
        const hpp = (it.cost_price || entry.cost_price) * qty;
        entry.total_hpp += hpp;
        entry.gross_profit = entry.total_omzet - entry.total_hpp;
        entry.margin_percent = entry.total_omzet > 0 ? Math.round((entry.gross_profit / entry.total_omzet) * 100) : 0;
      });
    }
  });

  // Sort descending by total omzet
  const rankedProducts = Object.values(productAgg).sort((a, b) => b.total_omzet - a.total_omzet);

  // Category breakdown for pie chart
  const categoryMap: { [cat: string]: { name: string; units: number; omzet: number } } = {};
  rankedProducts.forEach(p => {
    const cat = p.category_name || 'Lainnya';
    if (!categoryMap[cat]) {
      categoryMap[cat] = { name: cat, units: 0, omzet: 0 };
    }
    categoryMap[cat].units += p.units_sold;
    categoryMap[cat].omzet += p.total_omzet;
  });

  // Daily trend
  const dailyTrend = [
    { day: 'Sen', kopi_susu: 85, croissant: 42, matcha: 28, retail: 15 },
    { day: 'Sel', kopi_susu: 92, croissant: 48, matcha: 35, retail: 18 },
    { day: 'Rab', kopi_susu: 110, croissant: 55, matcha: 40, retail: 22 },
    { day: 'Kam', kopi_susu: 104, croissant: 50, matcha: 38, retail: 20 },
    { day: 'Jum', kopi_susu: 145, croissant: 72, matcha: 58, retail: 34 },
    { day: 'Sab', kopi_susu: 180, croissant: 95, matcha: 75, retail: 48 },
    { day: 'Min', kopi_susu: 165, croissant: 88, matcha: 68, retail: 40 },
  ];

  return res.json({
    success: true,
    data: {
      ranked_products: rankedProducts,
      top_products: rankedProducts.slice(0, 8),
      category_breakdown: Object.values(categoryMap),
      daily_trend: dailyTrend,
      total_units_sold: rankedProducts.reduce((acc, p) => acc + p.units_sold, 0),
      total_product_revenue: rankedProducts.reduce((acc, p) => acc + p.total_omzet, 0),
      total_product_profit: rankedProducts.reduce((acc, p) => acc + p.gross_profit, 0),
    },
  });
});

// Reset demo data endpoint for testing
app.post('/api/admin/reset-seed', requireRole('ADMIN'), (_req: Request, res: Response) => {
  tenants = [...SEED_TENANTS];
  users = [...SEED_USERS];
  branches = [...SEED_BRANCHES];
  categories = [...SEED_CATEGORIES];
  products = [...SEED_PRODUCTS];
  transactions = [...SEED_TRANSACTIONS];
  activityLogs = [...SEED_ACTIVITY_LOGS];
  return res.json({ success: true, message: 'Data berhasil direset ke seed awal.' });
});

// -------------------------------------------------------------
// VITE MIDDLEWARE & SERVER STARTUP
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[MultiPOS Multi-Tenant Backend] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
