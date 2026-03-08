import {
  isAirtableConfigured,
  appointmentsTable,
  barbersTable,
  withdrawalsTable,
} from "./airtable";
import { isLocalBarberId } from "./local-barbers";

const REFERRAL_COMMISSION_RATE = 0.1;

export type BarberEarningsSummary = {
  myEarnings: number;
  referralEarnings: number;
  total: number;
  bookedEarnings: number;
  completedJobs: number;
  bookedJobs: number;
  withdrawnTotal: number;
  withdrawableBalance: number;
};

export async function getBarberEarningsSummary(
  barberId: string
): Promise<BarberEarningsSummary> {
  if (!isAirtableConfigured || !appointmentsTable || !barbersTable) {
    return {
      myEarnings: 0,
      referralEarnings: 0,
      total: 0,
      bookedEarnings: 0,
      completedJobs: 0,
      bookedJobs: 0,
      withdrawnTotal: 0,
      withdrawableBalance: 0,
    };
  }
  if (isLocalBarberId(barberId)) {
    return {
      myEarnings: 0,
      referralEarnings: 0,
      total: 0,
      bookedEarnings: 0,
      completedJobs: 0,
      bookedJobs: 0,
      withdrawnTotal: 0,
      withdrawableBalance: 0,
    };
  }

  const completedAppointments = await appointmentsTable
    .select({
      filterByFormula: `AND(
        FIND('${barberId}', ARRAYJOIN({Barber Assigned})),
        {Status} = 'Completed'
      )`,
    })
    .all();

  const bookedAppointments = await appointmentsTable
    .select({
      filterByFormula: `AND(
        FIND('${barberId}', ARRAYJOIN({Barber Assigned})),
        OR({Status} = 'Pending', {Status} = 'Approved')
      )`,
    })
    .all();

  const myEarnings = completedAppointments.reduce((sum, record) => {
    const rate = (record.get("Day Rate") as number) ?? 0;
    return sum + rate;
  }, 0);

  const bookedEarnings = bookedAppointments.reduce((sum, record) => {
    const rate = (record.get("Day Rate") as number) ?? 0;
    return sum + rate;
  }, 0);

  const referredBarbers = await barbersTable
    .select({
      filterByFormula: `FIND('${barberId}', ARRAYJOIN({Referring Barber ID}))`,
    })
    .all();

  const referredIds = referredBarbers.map((b) => b.id);
  let referralEarnings = 0;

  if (referredIds.length > 0) {
    const referredAppointments = await appointmentsTable
      .select({
        filterByFormula: `AND(
          OR(${referredIds
            .map((id) => `FIND('${id}', ARRAYJOIN({Barber Assigned}))`)
            .join(",")}),
          {Status} = 'Completed'
        )`,
      })
      .all();

    const referredEarnings = referredAppointments.reduce((sum, record) => {
      const rate = (record.get("Day Rate") as number) ?? 0;
      return sum + rate;
    }, 0);
    referralEarnings = referredEarnings * REFERRAL_COMMISSION_RATE;
  }

  let withdrawnTotal = 0;
  if (withdrawalsTable) {
    const paidWithdrawals = await withdrawalsTable
      .select({
        filterByFormula: `AND(
          FIND('${barberId}', ARRAYJOIN({Barber})),
          {Status} = 'Paid'
        )`,
      })
      .all();
    withdrawnTotal = paidWithdrawals.reduce((sum, record) => {
      const amount = (record.get("Amount") as number) ?? 0;
      return sum + amount;
    }, 0);
  } else {
    try {
      const barber = await barbersTable.find(barberId);
      withdrawnTotal = (barber.get("Total Withdrawn") as number) ?? 0;
    } catch {
      withdrawnTotal = 0;
    }
  }

  const total = myEarnings + referralEarnings;
  const withdrawableBalance = Math.max(0, total - withdrawnTotal);

  return {
    myEarnings,
    referralEarnings,
    total,
    bookedEarnings,
    completedJobs: completedAppointments.length,
    bookedJobs: bookedAppointments.length,
    withdrawnTotal,
    withdrawableBalance,
  };
}

export async function calculateBarberEarnings(barberId: string) {
  const summary = await getBarberEarningsSummary(barberId);
  return {
    myEarnings: summary.myEarnings,
    referralEarnings: summary.referralEarnings,
    total: summary.total,
  };
}
