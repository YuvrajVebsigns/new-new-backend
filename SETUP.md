# 🚀 Environment Setup Guide

## Quick Start

### 1. Copy `.env.example` to `.env.local`
```bash
cp .env.example .env.local
```

### 2. Configure Storage Provider

#### Option A: Local Storage (Development)
```bash
STORAGE_PROVIDER=local
UPLOADS_DIR=./uploads
CDN_URL=http://localhost:5050/uploads
```

#### Option B: Supabase Storage (Recommended)

**Step 1: Create Supabase Project**
1. Visit [supabase.com](https://supabase.com)
2. Sign up/log in
3. Create a new project

**Step 2: Get Your Credentials**

1. **SUPABASE_URL**: 
   - Project → Settings (⚙️) → API
   - Copy **Project URL**
   - Example: `https://abcdef123456.supabase.co`

2. **SUPABASE_KEY**:
   - Same page → **anon public** key
   - Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

3. **Create Storage Bucket**:
   - Go to **Storage** tab
   - Click **+ New bucket**
   - Name: `media` (or your choice)
   - Make it **Public** so images are accessible

**Step 3: Update `.env.local`**
```bash
STORAGE_PROVIDER=supabase
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-anon-key-here
SUPABASE_BUCKET=media
SUPABASE_CDN_URL=https://your-project-id.supabase.co/storage/v1/object/public/media
```

#### Option C: AWS S3 / S3-Compatible Storage
```bash
STORAGE_PROVIDER=s3
S3_REGION=us-east-1
S3_ENDPOINT=https://s3.amazonaws.com
S3_BUCKET=your-bucket-name
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
CDN_URL=https://your-bucket-name.s3.amazonaws.com
```

### 3. Other Required Variables

```bash
# JWT Secret (use strong random string in production)
JWT_SECRET=your-super-secret-key-123

# MongoDB
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/dbname

# Email Provider (Optional)
BREVO_API_KEY=xkeysib-xxxxx
BREVO_SENDER_EMAIL=noreply@example.com
```

### 4. Start Development Server
```bash
yarn dev
# or for production build
yarn build && yarn start
```

---

## ✅ Checklist

- [ ] `.env.local` file created (never commit this!)
- [ ] Storage provider configured (local/supabase/s3)
- [ ] JWT_SECRET set
- [ ] MONGODB_URI configured
- [ ] (Optional) Email provider configured
- [ ] Run `yarn dev` to test

---

## 🔐 Security Notes

1. **Never commit `.env.local`** - it's in `.gitignore`
2. **Keep secrets safe** - Use GitHub Secrets for CI/CD
3. **Use anon key for Supabase** - not service_role key in frontend
4. **Rotate keys regularly** in production
5. **Never share credentials** via Slack/email

---

## 📝 GitHub Secrets Setup (for CI/CD)

If deploying via GitHub Actions:

1. Go to Repo → Settings → Secrets and variables → Actions
2. Add these secrets:
   - `STORAGE_PROVIDER` = `supabase`
   - `SUPABASE_URL` = `https://your-project.supabase.co`
   - `SUPABASE_KEY` = `eyJhbGc...`
   - `MONGODB_URI` = `mongodb+srv://...`
   - `JWT_SECRET` = `your-secret-key`

3. Reference in `.github/workflows/deploy.yml`:
```yaml
env:
  STORAGE_PROVIDER: ${{ secrets.STORAGE_PROVIDER }}
  SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
  SUPABASE_KEY: ${{ secrets.SUPABASE_KEY }}
```

---

## 🆘 Troubleshooting

### "Cannot connect to Supabase"
- Verify `SUPABASE_URL` and `SUPABASE_KEY` are correct
- Check bucket exists in Supabase Storage
- Try creating a bucket named exactly `media`

### "Upload fails with 403 Unauthorized"
- Check Supabase bucket permissions
- Make sure bucket is **Public**
- Verify you're using **anon** key, not service_role

### "Files not showing in UI"
- Verify `SUPABASE_CDN_URL` is correct
- Check browser console for 404 errors
- Ensure files were actually uploaded to correct bucket

---

## 📚 Helpful Links

- [Supabase Docs](https://supabase.com/docs)
- [Supabase Storage Guide](https://supabase.com/docs/guides/storage)
- [AWS S3 Guide](https://docs.aws.amazon.com/s3/)
