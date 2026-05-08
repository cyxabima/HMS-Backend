// TODO:  types: There is other way to add global types we can embbed the user to Request type using express.d.ts something like that
// TODO:  we can also import all env in the applcation and then export them so that we reduce the process.env thing
//
//
//exmaple of how the tranaction controller look
// export async function loader() {
//   // 1. Fetch the raw data with Left Joins
//   const rawTransactions = await db
//     .select({
//       id: transactions.id,
//       txnNo: transactions.txnNo,
//       type: transactions.type,
//       amount: transactions.amount,
//
//       // Pull the names directly from the related master tables
//       doctorName: doctors.doctorName,
//       serviceName: services.name, // Assuming your services table has a 'name' col
//       roomNo: rooms.roomNumber,   // Assuming your rooms table has a 'roomNumber' col
//     })
//     .from(transactions)
//     // Left Join Doctors
//     .leftJoin(doctorTransactions, eq(transactions.id, doctorTransactions.transactionId))
//     .leftJoin(doctors, eq(doctorTransactions.doctorId, doctors.id))
//     // Left Join Services
//     .leftJoin(serviceTransactions, eq(transactions.id, serviceTransactions.transactionId))
//     .leftJoin(services, eq(serviceTransactions.serviceId, services.id))
//     // Left Join Rooms
//     .leftJoin(roomTransactions, eq(transactions.id, roomTransactions.transactionId))
//     .leftJoin(rooms, eq(roomTransactions.roomId, rooms.id))
//     .orderBy(desc(transactions.createdAt));
//
//   // 2. Dynamically construct the "detail" string for the UI
//   const formattedTransactions = rawTransactions.map((txn) => {
//     let dynamicDetail = "Unknown Transaction";
//
//     if (txn.type === "DOCTOR" && txn.doctorName) {
//       dynamicDetail = `Dr. ${txn.doctorName} (Consult)`;
//     } else if (txn.type === "SERVICE" && txn.serviceName) {
//       dynamicDetail = txn.serviceName;
//     } else if (txn.type === "ROOM" && txn.roomNo) {
//       dynamicDetail = `Room ${txn.roomNo}`;
//     }
//
//     return {
//       id: txn.id,
//       txnNo: txn.txnNo,
//       type: txn.type,
//       amount: Number(txn.amount),
//       detail: dynamicDetail, // <-- Passed dynamically to the UI!
//     };
//   });
//
//   return {
//     transactions: formattedTransactions,
//     // ... stats logic
//   };
// }
