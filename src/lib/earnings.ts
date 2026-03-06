import { appointmentsTable, barbersTable } from "./airtable";

const REFERRAL_COMMISSION_RATE = 0.1;

export async function calculateBarberEarnings(barberId: string) {
  // Direct earnings from this barber's completed appointments
  const myAppointments = await appointmentsTable
    .select({
      filterByFormula: `AND(
        FIND('${barberId}', ARRAYJOIN({Barber Assigned})),
        {Status} = 'Completed'
      )`,
    })
    .all();

  const myEarnings = myAppointments.reduce((sum, record) => {
    const rate = (record.get("Day Rate") as number) ?? 0;
    return sum + rate;
  }, 0);

  // Find barbers referred by this barber
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
            .map(
              (id) => `FIND('${id}', ARRAYJOIN({Barber Assigned}))`
            )
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

  return {
    myEarnings,
    referralEarnings,
    total: myEarnings + referralEarnings,
  };
}

