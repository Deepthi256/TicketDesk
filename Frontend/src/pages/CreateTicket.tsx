import TicketForm from "../components/TicketForm";

export default function CreateTicket() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Create IT Support Ticket</h1>
        <p className="text-sm text-slate-500">Submit a new incident or service request ticket</p>
      </div>

      <TicketForm />
    </div>
  );
}