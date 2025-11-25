const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("DocumentApprovalManager", function () {
  let approvalManager;
  let documentManager;
  let owner, admin, faculty1, faculty2, faculty3, student1, student2;
  
  // Role hashes
  let ADMIN_ROLE, FACULTY_ROLE, STUDENT_ROLE, VERIFIER_ROLE;

  // Test data
  const documentId = ethers.keccak256(ethers.toUtf8Bytes("doc123"));
  const ipfsHash = "QmXyZ123abcdefghijklmnopqrstuvwxyz";
  const version = "v1.0";

  beforeEach(async function () {
    // Get signers
    [owner, admin, faculty1, faculty2, faculty3, student1, student2] = await ethers.getSigners();

    // Deploy DocumentManagerV2 first (or use mock address)
    const DocumentManagerV2 = await ethers.getContractFactory("DocumentManagerV2");
    documentManager = await DocumentManagerV2.deploy();
    await documentManager.waitForDeployment();
    const documentManagerAddress = await documentManager.getAddress();

    // Deploy DocumentApprovalManager
    const DocumentApprovalManager = await ethers.getContractFactory("DocumentApprovalManager");
    approvalManager = await DocumentApprovalManager.deploy(documentManagerAddress);
    await approvalManager.waitForDeployment();

    // Get role hashes
    ADMIN_ROLE = await approvalManager.ADMIN_ROLE();
    FACULTY_ROLE = await approvalManager.FACULTY_ROLE();
    STUDENT_ROLE = await approvalManager.STUDENT_ROLE();
    VERIFIER_ROLE = await approvalManager.VERIFIER_ROLE();

    // Grant roles
    await approvalManager.grantRoleToUser(ADMIN_ROLE, admin.address);
    await approvalManager.grantRoleToUser(FACULTY_ROLE, faculty1.address);
    await approvalManager.grantRoleToUser(FACULTY_ROLE, faculty2.address);
    await approvalManager.grantRoleToUser(FACULTY_ROLE, faculty3.address);
    await approvalManager.grantRoleToUser(STUDENT_ROLE, student1.address);
    await approvalManager.grantRoleToUser(STUDENT_ROLE, student2.address);
  });

  describe("Deployment", function () {
    it("Should set the correct owner and roles", async function () {
      expect(await approvalManager.hasRole(ADMIN_ROLE, owner.address)).to.be.true;
    });

    it("Should have correct DocumentManager reference", async function () {
      const docManagerAddr = await approvalManager.documentManagerAddress();
      expect(docManagerAddr).to.equal(await documentManager.getAddress());
    });
  });

  describe("Sequential Approval", function () {
    let requestId;

    it("Should create sequential approval request", async function () {
      const approvers = [faculty1.address, faculty2.address, faculty3.address];
      
      const tx = await approvalManager.connect(student1).requestApproval(
        documentId,
        ipfsHash,
        approvers,
        0, // SEQUENTIAL
        0, // STANDARD
        1, // NORMAL
        0, // No expiry
        version
      );

      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try {
          return approvalManager.interface.parseLog(log).name === "ApprovalRequested";
        } catch (e) {
          return false;
        }
      });

      const parsedEvent = approvalManager.interface.parseLog(event);
      requestId = parsedEvent.args.requestId;

      expect(requestId).to.not.equal(ethers.ZeroHash);
    });

    it("Should approve in sequence", async function () {
      const approvers = [faculty1.address, faculty2.address];
      
      const tx = await approvalManager.connect(student1).requestApproval(
        documentId,
        ipfsHash,
        approvers,
        0, 0, 1, 0, version
      );
      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try {
          return approvalManager.interface.parseLog(log).name === "ApprovalRequested";
        } catch (e) {
          return false;
        }
      });
      requestId = approvalManager.interface.parseLog(event).args.requestId;

      // Faculty 1 approves (first in sequence)
      await approvalManager.connect(faculty1).approveDocument(
        requestId,
        ethers.ZeroHash,
        "Approved by faculty1"
      );

      // Check status after first approval
      let status = await approvalManager.getApprovalStatus(requestId);
      expect(status.approvedCount).to.equal(1);
      expect(status.isComplete).to.be.false;

      // Faculty 2 approves (second in sequence)
      await approvalManager.connect(faculty2).approveDocument(
        requestId,
        ethers.ZeroHash,
        "Approved by faculty2"
      );

      // Check final status
      status = await approvalManager.getApprovalStatus(requestId);
      expect(status.approvedCount).to.equal(2);
      expect(status.isApproved).to.be.true;
      expect(status.isComplete).to.be.true;
    });

    it("Should reject if approving out of order in sequential", async function () {
      const approvers = [faculty1.address, faculty2.address];
      
      const tx = await approvalManager.connect(student1).requestApproval(
        documentId,
        ipfsHash,
        approvers,
        0, 0, 1, 0, version
      );
      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try {
          return approvalManager.interface.parseLog(log).name === "ApprovalRequested";
        } catch (e) {
          return false;
        }
      });
      requestId = approvalManager.interface.parseLog(event).args.requestId;

      // Faculty 2 tries to approve before faculty 1 (should fail)
      await expect(
        approvalManager.connect(faculty2).approveDocument(
          requestId,
          ethers.ZeroHash,
          "Trying to skip"
        )
      ).to.be.revertedWith("Not your turn to approve");
    });

    it("Should reject entire request if any approver rejects", async function () {
      const approvers = [faculty1.address, faculty2.address, faculty3.address];
      
      const tx = await approvalManager.connect(student1).requestApproval(
        documentId,
        ipfsHash,
        approvers,
        0, 0, 1, 0, version
      );
      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try {
          return approvalManager.interface.parseLog(log).name === "ApprovalRequested";
        } catch (e) {
          return false;
        }
      });
      requestId = approvalManager.interface.parseLog(event).args.requestId;

      // Faculty 1 approves
      await approvalManager.connect(faculty1).approveDocument(
        requestId,
        ethers.ZeroHash,
        "Approved"
      );

      // Faculty 2 rejects
      await approvalManager.connect(faculty2).rejectDocument(
        requestId,
        "Needs revision"
      );

      // Check status - should be REJECTED
      const status = await approvalManager.getApprovalStatus(requestId);
      expect(status.currentStatus).to.equal(4); // REJECTED
      expect(status.isComplete).to.be.true;
      expect(status.isApproved).to.be.false;

      // Faculty 3 cannot approve anymore
      await expect(
        approvalManager.connect(faculty3).approveDocument(
          requestId,
          ethers.ZeroHash,
          "Trying to approve"
        )
      ).to.be.revertedWith("Request not pending");
    });
  });

  describe("Parallel Approval", function () {
    let requestId;

    it("Should create parallel approval request", async function () {
      const approvers = [faculty1.address, faculty2.address, faculty3.address];
      
      const tx = await approvalManager.connect(student1).requestApproval(
        documentId,
        ipfsHash,
        approvers,
        1, // PARALLEL
        0, 1, 0, version
      );

      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try {
          return approvalManager.interface.parseLog(log).name === "ApprovalRequested";
        } catch (e) {
          return false;
        }
      });
      requestId = approvalManager.interface.parseLog(event).args.requestId;

      expect(requestId).to.not.equal(ethers.ZeroHash);
    });

    it("Should show PARTIAL status in parallel approval", async function () {
      const approvers = [faculty1.address, faculty2.address, faculty3.address];
      
      const tx = await approvalManager.connect(student1).requestApproval(
        documentId,
        ipfsHash,
        approvers,
        1, 0, 1, 0, version
      );
      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try {
          return approvalManager.interface.parseLog(log).name === "ApprovalRequested";
        } catch (e) {
          return false;
        }
      });
      requestId = approvalManager.interface.parseLog(event).args.requestId;

      // Faculty 1 approves
      await approvalManager.connect(faculty1).approveDocument(
        requestId,
        ethers.ZeroHash,
        "Approved"
      );

      // Check status - should show PARTIAL
      let status = await approvalManager.getApprovalStatus(requestId);
      expect(status.currentStatus).to.equal(2); // PARTIAL
      expect(status.approvedCount).to.equal(1);
      expect(status.totalApprovers).to.equal(3);

      // Faculty 2 approves
      await approvalManager.connect(faculty2).approveDocument(
        requestId,
        ethers.ZeroHash,
        "Approved"
      );

      // Still partial
      status = await approvalManager.getApprovalStatus(requestId);
      expect(status.currentStatus).to.equal(2); // PARTIAL
      expect(status.approvedCount).to.equal(2);

      // Faculty 3 approves (final)
      await approvalManager.connect(faculty3).approveDocument(
        requestId,
        ethers.ZeroHash,
        "Approved"
      );

      // Now approved
      status = await approvalManager.getApprovalStatus(requestId);
      expect(status.currentStatus).to.equal(3); // APPROVED
      expect(status.isApproved).to.be.true;
      expect(status.isComplete).to.be.true;
    });

    it("Should allow parallel approvers to approve in any order", async function () {
      const approvers = [faculty1.address, faculty2.address, faculty3.address];
      
      const tx = await approvalManager.connect(student1).requestApproval(
        documentId,
        ipfsHash,
        approvers,
        1, 0, 1, 0, version
      );
      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try {
          return approvalManager.interface.parseLog(log).name === "ApprovalRequested";
        } catch (e) {
          return false;
        }
      });
      requestId = approvalManager.interface.parseLog(event).args.requestId;

      // Approve in any order: 3, 1, 2
      await approvalManager.connect(faculty3).approveDocument(requestId, ethers.ZeroHash, "OK");
      await approvalManager.connect(faculty1).approveDocument(requestId, ethers.ZeroHash, "OK");
      await approvalManager.connect(faculty2).approveDocument(requestId, ethers.ZeroHash, "OK");

      const status = await approvalManager.getApprovalStatus(requestId);
      expect(status.isApproved).to.be.true;
    });

    it("Should reject entire request if any parallel approver rejects", async function () {
      const approvers = [faculty1.address, faculty2.address];
      
      const tx = await approvalManager.connect(student1).requestApproval(
        documentId,
        ipfsHash,
        approvers,
        1, 0, 1, 0, version
      );
      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try {
          return approvalManager.interface.parseLog(log).name === "ApprovalRequested";
        } catch (e) {
          return false;
        }
      });
      requestId = approvalManager.interface.parseLog(event).args.requestId;

      // Faculty 1 rejects
      await approvalManager.connect(faculty1).rejectDocument(
        requestId,
        "Not acceptable"
      );

      // Check status
      const status = await approvalManager.getApprovalStatus(requestId);
      expect(status.currentStatus).to.equal(4); // REJECTED
      expect(status.isApproved).to.be.false;
    });
  });

  describe("Digital Signature", function () {
    it("Should store signature hash with approval", async function () {
      const approvers = [faculty1.address];
      
      const tx = await approvalManager.connect(student1).requestApproval(
        documentId,
        ipfsHash,
        approvers,
        0, 1, 1, 0, version // DIGITAL_SIGNATURE type
      );
      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try {
          return approvalManager.interface.parseLog(log).name === "ApprovalRequested";
        } catch (e) {
          return false;
        }
      });
      const requestId = approvalManager.interface.parseLog(event).args.requestId;

      // Create signature hash
      const signatureHash = ethers.keccak256(ethers.toUtf8Bytes("My digital signature"));

      // Approve with signature
      await approvalManager.connect(faculty1).approveDocument(
        requestId,
        signatureHash,
        "Digitally signed"
      );

      // Verify signature is stored
      const steps = await approvalManager.getApprovalSteps(requestId);
      expect(steps[0].signatureHash).to.equal(signatureHash);
    });
  });

  describe("Priority Levels", function () {
    it("Should accept all priority levels", async function () {
      const approvers = [faculty1.address];

      // Test each priority level
      for (let priority = 0; priority <= 3; priority++) {
        const tx = await approvalManager.connect(student1).requestApproval(
          ethers.keccak256(ethers.toUtf8Bytes(`doc${priority}`)),
          ipfsHash,
          approvers,
          0, 0, priority, 0, version
        );
        await tx.wait();
      }
    });
  });

  describe("Expiry Date", function () {
    it("Should reject expired requests", async function () {
      const approvers = [faculty1.address];
      const expiryTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      
      const tx = await approvalManager.connect(student1).requestApproval(
        documentId,
        ipfsHash,
        approvers,
        0, 0, 1, expiryTime, version
      );
      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try {
          return approvalManager.interface.parseLog(log).name === "ApprovalRequested";
        } catch (e) {
          return false;
        }
      });
      const requestId = approvalManager.interface.parseLog(event).args.requestId;

      // Fast forward time past expiry
      await time.increase(3601);

      // Try to approve - should fail
      await expect(
        approvalManager.connect(faculty1).approveDocument(
          requestId,
          ethers.ZeroHash,
          "Too late"
        )
      ).to.be.revertedWith("Request expired");

      // Expire the request
      await approvalManager.expireRequest(requestId);

      // Check status
      const status = await approvalManager.getApprovalStatus(requestId);
      expect(status.currentStatus).to.equal(6); // EXPIRED
      expect(status.isExpired).to.be.true;
    });
  });

  describe("Cancellation", function () {
    it("Should allow requester to cancel pending request", async function () {
      const approvers = [faculty1.address];
      
      const tx = await approvalManager.connect(student1).requestApproval(
        documentId,
        ipfsHash,
        approvers,
        0, 0, 1, 0, version
      );
      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try {
          return approvalManager.interface.parseLog(log).name === "ApprovalRequested";
        } catch (e) {
          return false;
        }
      });
      const requestId = approvalManager.interface.parseLog(event).args.requestId;

      // Requester cancels
      await approvalManager.connect(student1).cancelRequest(requestId);

      // Check status
      const status = await approvalManager.getApprovalStatus(requestId);
      expect(status.currentStatus).to.equal(5); // CANCELLED
    });

    it("Should not allow non-requester to cancel", async function () {
      const approvers = [faculty1.address];
      
      const tx = await approvalManager.connect(student1).requestApproval(
        documentId,
        ipfsHash,
        approvers,
        0, 0, 1, 0, version
      );
      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try {
          return approvalManager.interface.parseLog(log).name === "ApprovalRequested";
        } catch (e) {
          return false;
        }
      });
      const requestId = approvalManager.interface.parseLog(event).args.requestId;

      // Faculty tries to cancel - should fail
      await expect(
        approvalManager.connect(faculty1).cancelRequest(requestId)
      ).to.be.revertedWith("Only requester can cancel");
    });
  });

  describe("Role Restrictions", function () {
    it("Should prevent students from being approvers", async function () {
      const approvers = [student2.address]; // Student as approver

      await expect(
        approvalManager.connect(student1).requestApproval(
          documentId,
          ipfsHash,
          approvers,
          0, 0, 1, 0, version
        )
      ).to.be.revertedWith("Students cannot be approvers");
    });

    it("Should prevent self-approval", async function () {
      const approvers = [faculty1.address]; // Self as approver

      await expect(
        approvalManager.connect(faculty1).requestApproval(
          documentId,
          ipfsHash,
          approvers,
          0, 0, 1, 0, version
        )
      ).to.be.revertedWith("Cannot approve own request");
    });
  });

  describe("Query Functions", function () {
    it("Should track requester's requests", async function () {
      const approvers = [faculty1.address];
      
      await approvalManager.connect(student1).requestApproval(
        documentId,
        ipfsHash,
        approvers,
        0, 0, 1, 0, "v1.0"
      );

      await approvalManager.connect(student1).requestApproval(
        ethers.keccak256(ethers.toUtf8Bytes("doc2")),
        ipfsHash,
        approvers,
        0, 0, 1, 0, "v1.0"
      );

      const requests = await approvalManager.getRequesterRequests(student1.address);
      expect(requests.length).to.equal(2);
    });

    it("Should track approver's requests", async function () {
      const approvers = [faculty1.address];
      
      await approvalManager.connect(student1).requestApproval(
        documentId,
        ipfsHash,
        approvers,
        0, 0, 1, 0, version
      );

      await approvalManager.connect(student2).requestApproval(
        ethers.keccak256(ethers.toUtf8Bytes("doc2")),
        ipfsHash,
        approvers,
        0, 0, 1, 0, version
      );

      const requests = await approvalManager.getApproverRequests(faculty1.address);
      expect(requests.length).to.equal(2);
    });

    it("Should track document requests", async function () {
      const approvers = [faculty1.address];
      
      // Create multiple requests for same document (revisions)
      await approvalManager.connect(student1).requestApproval(
        documentId,
        ipfsHash,
        approvers,
        0, 0, 1, 0, "v1.0"
      );

      await approvalManager.connect(student1).requestApproval(
        documentId,
        ipfsHash,
        approvers,
        0, 0, 1, 0, "v1.1"
      );

      const requests = await approvalManager.getDocumentRequests(documentId);
      expect(requests.length).to.equal(2);
    });
  });

  describe("Admin Functions", function () {
    it("Should allow admin to pause contract", async function () {
      await approvalManager.connect(owner).pause();
      
      const approvers = [faculty1.address];
      await expect(
        approvalManager.connect(student1).requestApproval(
          documentId,
          ipfsHash,
          approvers,
          0, 0, 1, 0, version
        )
      ).to.be.revertedWithCustomError(approvalManager, "EnforcedPause");
    });

    it("Should allow admin to update DocumentManager address", async function () {
      const newAddress = "0x1234567890123456789012345678901234567890";
      await approvalManager.connect(owner).setDocumentManagerAddress(newAddress);
      
      expect(await approvalManager.documentManagerAddress()).to.equal(newAddress);
    });
  });
});
