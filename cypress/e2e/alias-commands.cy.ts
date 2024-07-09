describe("cy.writeAlias()", () => {
  it("Verify the cy.writeAlias() command chained with subject", () => {
    cy.wrap("is working").writeAlias("chained1")
    cy.wrapAlias("@chained1").should("eq", "is working")
    cy.window({ log: false }).its("localStorage", { log: false }).invoke("removeItem", "chained1");

    cy.wrap({ text: "is working" }).writeAlias("chained2")
    cy.wrapAlias("@chained2.text").should("eq", "is working")
    cy.window({ log: false }).its("localStorage", { log: false }).invoke("removeItem", "chained2");
  });

  it("Verify the cy.writeAlias() command with given data", () => {
    cy.writeAlias("subject1", "is working")
    cy.wrapAlias("@subject1").should("eq", "is working")
    cy.window({ log: false }).its("localStorage", { log: false }).invoke("removeItem", "subject1");

    cy.writeAlias("subject2", { text: "is working" })
    cy.wrapAlias("@subject2.text").should("eq", "is working")
    cy.window({ log: false }).its("localStorage", { log: false }).invoke("removeItem", "subject2");
  });
})