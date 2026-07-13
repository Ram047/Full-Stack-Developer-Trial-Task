import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clean up existing records
  await prisma.rateLimitBucket.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.session.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.company.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('demo1234', 12);

  // 1. Create Users
  const owner = await prisma.user.create({
    data: {
      email: 'owner@demo.com',
      name: 'Sarah Owner',
      passwordHash,
      role: 'OWNER',
      emailVerified: true,
    },
  });

  const admin = await prisma.user.create({
    data: {
      email: 'admin@demo.com',
      name: 'Alex Admin',
      passwordHash,
      role: 'ADMIN',
      emailVerified: true,
    },
  });

  const member = await prisma.user.create({
    data: {
      email: 'member@demo.com',
      name: 'Mike Member',
      passwordHash,
      role: 'MEMBER',
      emailVerified: true,
    },
  });

  const viewer = await prisma.user.create({
    data: {
      email: 'demo@demo.com', // The default demo login
      name: 'Valerie Viewer',
      passwordHash,
      role: 'VIEWER',
      emailVerified: true,
    },
  });

  console.log('Users created successfully.');

  // 2. Create Companies
  const companies = [
    { name: 'Stripe', domain: 'https://stripe.com', industry: 'Fintech', size: '5000+' },
    { name: 'Vercel', domain: 'https://vercel.com', industry: 'Developer Tools', size: '100-500' },
    { name: 'Google', domain: 'https://google.com', industry: 'Technology', size: '10000+' },
    { name: 'Linear', domain: 'https://linear.app', industry: 'SaaS', size: '50-100' },
    { name: 'Acme Corp', domain: 'https://acme.org', industry: 'Manufacturing', size: '500-1000' },
  ];

  const seededCompanies = [];
  for (const c of companies) {
    const company = await prisma.company.create({
      data: {
        ...c,
        ownerId: admin.id,
      },
    });
    seededCompanies.push(company);
  }
  console.log('Companies created.');

  // 3. Create Contacts
  const contacts = [
    { name: 'John Collison', email: 'john@stripe.com', phone: '+1-555-0199', title: 'Co-founder', companyIndex: 0 },
    { name: 'Guillermo Rauch', email: 'g@vercel.com', phone: '+1-555-0120', title: 'CEO', companyIndex: 1 },
    { name: 'Sundar Pichai', email: 'sundar@google.com', phone: '+1-555-0100', title: 'CEO', companyIndex: 2 },
    { name: 'Karri Saarinen', email: 'karri@linear.app', phone: '+1-555-0144', title: 'CEO', companyIndex: 3 },
    { name: 'Wile E. Coyote', email: 'coyote@acme.org', phone: '+1-555-0155', title: 'Lead Engineer', companyIndex: 4 },
  ];

  const seededContacts = [];
  for (const ct of contacts) {
    const contact = await prisma.contact.create({
      data: {
        name: ct.name,
        email: ct.email,
        phone: ct.phone,
        title: ct.title,
        companyId: seededCompanies[ct.companyIndex].id,
        ownerId: member.id,
      },
    });
    seededContacts.push(contact);
  }
  console.log('Contacts created.');

  // 4. Create Deals
  const deals = [
    { title: 'Stripe Enterprise Plan License', value: 85000, stage: 'PROPOSAL', probability: 60, compIndex: 0, contIndex: 0 },
    { title: 'Vercel Deployment Integration Support', value: 24000, stage: 'QUALIFIED', probability: 40, compIndex: 1, contIndex: 1 },
    { title: 'Google Workspace Migration Partnership', value: 150000, stage: 'NEGOTIATION', probability: 80, compIndex: 2, contIndex: 2 },
    { title: 'Linear Team Upgrade Renewal', value: 12000, stage: 'WON', probability: 100, compIndex: 3, contIndex: 3 },
    { title: 'Acme Anvil Supply Contract', value: 5000, stage: 'LEAD', probability: 10, compIndex: 4, contIndex: 4 },
    { title: 'Stripe Billing API Consultation', value: 15000, stage: 'LOST', probability: 0, compIndex: 0, contIndex: 0 },
    { title: 'Vercel Next.js Workshop Training', value: 9500, stage: 'WON', probability: 100, compIndex: 1, contIndex: 1 },
    { title: 'Linear Software Tooling Integration', value: 38000, stage: 'PROPOSAL', probability: 50, compIndex: 3, contIndex: 3 },
  ];

  for (const d of deals) {
    await prisma.deal.create({
      data: {
        title: d.title,
        value: d.value,
        stage: d.stage,
        probability: d.probability,
        companyId: seededCompanies[d.compIndex].id,
        contactId: seededContacts[d.contIndex].id,
        ownerId: member.id,
        expectedCloseDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 days from now
      },
    });
  }
  console.log('Deals created.');

  // 5. Seed Activity Logs
  await prisma.activityLog.create({
    data: {
      userId: owner.id,
      entityType: 'AUTH',
      action: 'LOGIN',
      details: JSON.stringify({ ip: '127.0.0.1', message: 'Owner seeded and auto-logged in.' }),
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: admin.id,
      entityType: 'DEAL',
      action: 'CREATE',
      details: JSON.stringify({ title: 'Google Workspace Migration Partnership', value: 150000 }),
    },
  });

  console.log('Database seeded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
