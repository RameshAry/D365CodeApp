import { useState, useEffect } from "react";
import { ContactsService } from "./generated/services/ContactsService";
import { AccountsService } from "./generated/services/AccountsService";
import type { Contacts } from "./generated/models/ContactsModel";
import type { Accounts } from "./generated/models/AccountsModel";
import { Button, Code, Menu, Portal, Stack } from "@chakra-ui/react"
import "./App.css";
import Demo from "./components/Openform";

type ContactWithLookup = Contacts & {
  "_parentcustomerid_value@OData.Community.Display.V1.FormattedValue"?: string;
};




function App() {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"contacts" | "accounts">(
    "contacts",
  );
  const [contacts, setContacts] = useState<ContactWithLookup[]>([]);
  const [accounts, setAccounts] = useState<Accounts[]>([]);
  const [loading, setLoading] = useState(false);

  async function debugContactLookups() {
  const { data } = await ContactsService.getMetadata({
    schema: { manyToOne: true }
  });

  console.log("LOOKUPS:", data.ManyToOneRelationships?.map(r => ({
    lookupField: r.ReferencingAttribute,
    relatedTable: r.ReferencedEntity,
    nameField: r.ReferencingAttribute + "name"
  })));
}


  // Form state for creating a contact
  const [form, setForm] = useState({
    firstname: "",
    lastname: "",
    emailaddress1: "",
    accountId: "",
  });

  // Payload type for Dataverse create/update
  type ContactPayload = {
    firstname: string;
    lastname: string;
    emailaddress1: string;
    "parentcustomerid_account@odata.bind"?: string;
  };

  useEffect(() => {
    debugContactLookups();

    if (activeTab === "contacts") {
      fetchContacts();
      fetchAccounts(); // Needed for lookup dropdown
    } else {
      fetchAccounts();
    }
  }, [activeTab]);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      // const result = await ContactsService.getAll({
      //   select: ["firstname", "lastname", "emailaddress1", "contactid"],
      //   expand: {
      //     parentcustomerid_account: {
      //       select: ["name"]
      //     }
      //   },
      //   orderBy: ["lastname asc"]
      // });

      try {
  //  const result = await ContactsService.getAll();
   const result = await ContactsService.getAll({
  select: [
    "firstname",
    "lastname",
    "emailaddress1",
    "contactid",
    "_parentcustomerid_value"
  ],
  orderBy: ["lastname asc"]
});

  //  const result = await ContactsService.getAll({ select: ["firstname", "lastname", "emailaddress1", "contactid"], expand: { parentcustomerid_account: { select: ["name"] } }, orderBy: ["lastname asc"] });
   if (result.data) {
         const contacts = result.data;
         console.log(contacts);
         setContacts((result.data as ContactWithLookup[]) || []);
      }
    } catch (err) {``
      console.error('Failed to retrieve contacts:', err);
    }


      
    } catch (err) {
      console.error("Failed to fetch contacts:", err);
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const result = await AccountsService.getAll({
        select: ["name", "accountid"],
        orderBy: ["name asc"],
      });
      setAccounts(result.data || []);
    } catch (err) {
      console.error("Failed to fetch accounts:", err);
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  // CREATE CONTACT
  const createContact = async () => {
    if (!form.lastname) {
      alert("Last Name is required");
      return;
    }

    const payload: ContactPayload = {
      firstname: form.firstname || "",
      lastname: form.lastname || "",
      emailaddress1: form.emailaddress1 || "",
      ...(form.accountId && {
        "parentcustomerid_account@odata.bind": `/accounts(${form.accountId})`,
      }),
    };

    try {
      await ContactsService.create(payload as any);
      alert("Contact created!");

      // Reset form
      setForm({
        firstname: "",
        lastname: "",
        emailaddress1: "",
        accountId: "",
      });

      fetchContacts();
    } catch (err) {
      console.error("Failed to create contact", err);
      alert("Error creating contact");
    }
  };

  return (
    <div className="App">
      <h1>Dataverse Viewer</h1>
      <Demo />

      {/* Top Navigation */}
      <nav className="top-nav">
        <button
          className={activeTab === "contacts" ? "active" : ""}
          onClick={() => setActiveTab("contacts")}
        >
          Contacts
        </button>
        <button
          className={activeTab === "accounts" ? "active" : ""}
          onClick={() => setActiveTab("accounts")}
        >
          Accounts
        </button>
      </nav>

      {/* CONTACTS TAB */}
      {activeTab === "contacts" && (
        <div>
          {/* CREATE CONTACT FORM */}
          <h2>Create Contact</h2>
          <div className="form-container">
            <label>First Name</label>
            <input
              value={form.firstname}
              onChange={(e) => setForm({ ...form, firstname: e.target.value })}
            />

            <label>Last Name *</label>
            <input
              value={form.lastname}
              onChange={(e) => setForm({ ...form, lastname: e.target.value })}
            />

            <label>Email</label>
            <input
              value={form.emailaddress1}
              onChange={(e) =>
                setForm({ ...form, emailaddress1: e.target.value })
              }
            />

            <label>Account (Lookup)</label>
            <select
              value={form.accountId}
              onChange={(e) => setForm({ ...form, accountId: e.target.value })}
            >
              <option value="">-- Select Account --</option>
              {accounts.map((a) => (
                <option key={a.accountid} value={a.accountid}>
                  {a.name}
                </option>
              ))}
            </select>

            <button onClick={createContact} className="create-btn">
              Create Contact
            </button>
          </div>

          {/* CONTACT LIST */}
          {loading ? (
            <p>Loading...</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>First</th>
                  <th>Last</th>
                  <th>Email</th>
                  <th>Account</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((c) => (
                  <tr key={c.contactid}>
                    <td>{c.firstname}</td>
                    <td>{c.lastname}</td>
                    <td>{c.emailaddress1}</td>
                   <td>
                    {c["_parentcustomerid_value@OData.Community.Display.V1.FormattedValue"] || "-"}
                  </td>

                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ACCOUNTS TAB */}
      {activeTab === "accounts" && (
        <div>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Account Name</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((a) => (
                  <tr key={a.accountid}>
                    <td>{a.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
      <Stack gap="4" align="flex-start">
      <Code>open: {String(open)}</Code>
      <Menu.Root open={open} onOpenChange={(e) => setOpen(e.open)}>
        <Menu.Trigger asChild>
          <Button variant="outline" size="sm">
            Open
          </Button>
        </Menu.Trigger>
        <Portal>
          <Menu.Positioner>
            <Menu.Content>
              <Menu.Item value="new-txt">New Text File</Menu.Item>
              <Menu.Item value="new-file">New File...</Menu.Item>
              <Menu.Item value="new-win">New Window</Menu.Item>
              <Menu.Item value="open-file">Open File...</Menu.Item>
              <Menu.Item value="export">Export</Menu.Item>
            </Menu.Content>
          </Menu.Positioner>
        </Portal>
      </Menu.Root>
    </Stack>
    </div>
  );


}

export default App;
