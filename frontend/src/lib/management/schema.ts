// Generated from API Endpoint/Shared/schemas.json revision 1.0.0. Regenerate with node scripts/generate-management-contracts.mjs.
export type StudentProfile = { id: string; studentCode: string; fullName: string; gender: "MALE" | "FEMALE"; className: string; faculty: string; phone: string | null; email: string | null; dateOfBirth: string | null; permanentAddress: string | null; createdAt: string; updatedAt: string };
export type Building = { id: string; code: string; name: string; createdAt: string; updatedAt: string };
export type Room = { id: string; buildingId: string; buildingCode: string; buildingName: string; code: string; capacity: number; gender: "MALE" | "FEMALE"; feeVnd: string; status: "ACTIVE" | "INACTIVE"; allocatedPlaces: number; availablePlaces: number; createdAt: string; updatedAt: string };
export type Application = { id: string; studentId: string; preferredRoomId: string; periodId: 1; status: "PENDING" | "APPROVED" | "REJECTED"; rejectionReason: string | null; reviewedBy: string | null; reviewedAt: string | null; createdAt: string; updatedAt: string };
export type Residence = { id: string; applicationId: string; studentId: string; roomId: string; status: "ALLOCATED" | "CHECKED_IN" | "ENDED" | "CANCELLED"; allocatedBy: string; allocatedAt: string; checkInDate: string | null; checkedInBy: string | null; checkedInAt: string | null; checkOutDate: string | null; checkedOutBy: string | null; checkedOutAt: string | null; cancellationReason: string | null; cancelledBy: string | null; cancelledAt: string | null };
export type Receipt = { id: string; residenceId: string; amountVnd: string; status: "UNPAID" | "PAID"; createdBy: string; createdAt: string; paymentDate: string | null; paidBy: string | null; paidAt: string | null };
export type RegistrationPeriod = { id: 1; status: "OPEN" | "CLOSED"; updatedBy: string | null; updatedAt: string };
export type Statistics = { totalRooms: number; availablePlaces: number; currentResidents: number; unpaidReceipts: number };
export type ApprovalResult = { application: Application; residence: Residence };
export type StudentProfileQuery = { page?: number; pageSize?: number; q?: string; gender?: "MALE" | "FEMALE" };
export type BuildingQuery = { page?: number; pageSize?: number; q?: string };
export type RoomQuery = { page?: number; pageSize?: number; q?: string; buildingId?: string; gender?: "MALE" | "FEMALE"; hasAvailability?: boolean; status?: "ACTIVE" | "INACTIVE" };
export type ApplicationQuery = { page?: number; pageSize?: number; status?: "PENDING" | "APPROVED" | "REJECTED"; studentId?: string; preferredRoomId?: string };
export type ResidenceQuery = { page?: number; pageSize?: number; status?: "ALLOCATED" | "CHECKED_IN" | "ENDED" | "CANCELLED"; studentId?: string; roomId?: string };
export type ReceiptQuery = { page?: number; pageSize?: number; status?: "UNPAID" | "PAID"; studentId?: string; residenceId?: string };
export type ProfileCreate = { studentCode: string; fullName: string; gender: "MALE" | "FEMALE"; className: string; faculty: string; phone?: string | null; email?: string | null; dateOfBirth?: string | null; permanentAddress?: string | null };
export type ProfilePatch = { fullName?: string; gender?: "MALE" | "FEMALE"; className?: string; faculty?: string; phone?: string | null; email?: string | null; dateOfBirth?: string | null; permanentAddress?: string | null };
export type BuildingCreate = { code: string; name: string };
export type BuildingPatch = { name: string };
export type RoomCreate = { buildingId: string; code: string; capacity: number; gender: "MALE" | "FEMALE"; feeVnd: string; status: "ACTIVE" | "INACTIVE" };
export type RoomPatch = { capacity?: number; gender?: "MALE" | "FEMALE"; feeVnd?: string; status?: "ACTIVE" | "INACTIVE" };
export type PeriodPatch = { status: "OPEN" | "CLOSED" };
export type ApplicationApprove = { roomId: string };
export type ApplicationReject = { reason: string };
export type CheckIn = { checkInDate: string };
export type CancelAllocation = { reason: string };
export type CheckOut = { checkOutDate: string };
export type ReceiptCreate = { residenceId: string };
export type ReceiptPay = { paymentDate: string };
export const schemas = {
  "StudentProfile": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "id": {
        "type": "string",
        "format": "uuid"
      },
      "studentCode": {
        "type": "string",
        "pattern": "^[A-Z0-9][A-Z0-9_-]{0,31}$"
      },
      "fullName": {
        "type": "string",
        "minLength": 1,
        "maxLength": 150
      },
      "gender": {
        "type": "string",
        "enum": [
          "MALE",
          "FEMALE"
        ]
      },
      "className": {
        "type": "string",
        "minLength": 1,
        "maxLength": 100
      },
      "faculty": {
        "type": "string",
        "minLength": 1,
        "maxLength": 100
      },
      "phone": {
        "type": [
          "string",
          "null"
        ],
        "pattern": "^\\+?[0-9]{7,20}$"
      },
      "email": {
        "type": [
          "string",
          "null"
        ],
        "format": "email",
        "maxLength": 254
      },
      "dateOfBirth": {
        "type": [
          "string",
          "null"
        ],
        "format": "date"
      },
      "permanentAddress": {
        "type": [
          "string",
          "null"
        ],
        "minLength": 1,
        "maxLength": 500
      },
      "createdAt": {
        "type": "string",
        "format": "date-time"
      },
      "updatedAt": {
        "type": "string",
        "format": "date-time"
      }
    },
    "required": [
      "id",
      "studentCode",
      "fullName",
      "gender",
      "className",
      "faculty",
      "phone",
      "email",
      "dateOfBirth",
      "permanentAddress",
      "createdAt",
      "updatedAt"
    ]
  },
  "Building": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "id": {
        "type": "string",
        "format": "uuid"
      },
      "code": {
        "type": "string",
        "pattern": "^[A-Z0-9][A-Z0-9_-]{0,31}$"
      },
      "name": {
        "type": "string",
        "minLength": 1,
        "maxLength": 150
      },
      "createdAt": {
        "type": "string",
        "format": "date-time"
      },
      "updatedAt": {
        "type": "string",
        "format": "date-time"
      }
    },
    "required": [
      "id",
      "code",
      "name",
      "createdAt",
      "updatedAt"
    ]
  },
  "Room": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "id": {
        "type": "string",
        "format": "uuid"
      },
      "buildingId": {
        "type": "string",
        "format": "uuid"
      },
      "buildingCode": {
        "type": "string",
        "pattern": "^[A-Z0-9][A-Z0-9_-]{0,31}$"
      },
      "buildingName": {
        "type": "string",
        "minLength": 1,
        "maxLength": 150
      },
      "code": {
        "type": "string",
        "pattern": "^[A-Z0-9][A-Z0-9_-]{0,31}$"
      },
      "capacity": {
        "type": "integer",
        "minimum": 1,
        "maximum": 10000
      },
      "gender": {
        "type": "string",
        "enum": [
          "MALE",
          "FEMALE"
        ]
      },
      "feeVnd": {
        "type": "string",
        "pattern": "^(0|[1-9][0-9]{0,18})$",
        "description": "VND nguyên đồng, giá trị <=9223372036854775807; không ép sang Number."
      },
      "status": {
        "type": "string",
        "enum": [
          "ACTIVE",
          "INACTIVE"
        ]
      },
      "allocatedPlaces": {
        "type": "integer",
        "minimum": 0
      },
      "availablePlaces": {
        "type": "integer",
        "minimum": 0
      },
      "createdAt": {
        "type": "string",
        "format": "date-time"
      },
      "updatedAt": {
        "type": "string",
        "format": "date-time"
      }
    },
    "required": [
      "id",
      "buildingId",
      "buildingCode",
      "buildingName",
      "code",
      "capacity",
      "gender",
      "feeVnd",
      "status",
      "allocatedPlaces",
      "availablePlaces",
      "createdAt",
      "updatedAt"
    ]
  },
  "Application": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "id": {
        "type": "string",
        "format": "uuid"
      },
      "studentId": {
        "type": "string",
        "format": "uuid"
      },
      "preferredRoomId": {
        "type": "string",
        "format": "uuid"
      },
      "periodId": {
        "type": "integer",
        "const": 1
      },
      "status": {
        "type": "string",
        "enum": [
          "PENDING",
          "APPROVED",
          "REJECTED"
        ]
      },
      "rejectionReason": {
        "type": [
          "string",
          "null"
        ],
        "minLength": 1,
        "maxLength": 500
      },
      "reviewedBy": {
        "type": [
          "string",
          "null"
        ],
        "format": "uuid"
      },
      "reviewedAt": {
        "type": [
          "string",
          "null"
        ],
        "format": "date-time"
      },
      "createdAt": {
        "type": "string",
        "format": "date-time"
      },
      "updatedAt": {
        "type": "string",
        "format": "date-time"
      }
    },
    "required": [
      "id",
      "studentId",
      "preferredRoomId",
      "periodId",
      "status",
      "rejectionReason",
      "reviewedBy",
      "reviewedAt",
      "createdAt",
      "updatedAt"
    ]
  },
  "Residence": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "id": {
        "type": "string",
        "format": "uuid"
      },
      "applicationId": {
        "type": "string",
        "format": "uuid"
      },
      "studentId": {
        "type": "string",
        "format": "uuid"
      },
      "roomId": {
        "type": "string",
        "format": "uuid"
      },
      "status": {
        "type": "string",
        "enum": [
          "ALLOCATED",
          "CHECKED_IN",
          "ENDED",
          "CANCELLED"
        ]
      },
      "allocatedBy": {
        "type": "string",
        "format": "uuid"
      },
      "allocatedAt": {
        "type": "string",
        "format": "date-time"
      },
      "checkInDate": {
        "type": [
          "string",
          "null"
        ],
        "format": "date"
      },
      "checkedInBy": {
        "type": [
          "string",
          "null"
        ],
        "format": "uuid"
      },
      "checkedInAt": {
        "type": [
          "string",
          "null"
        ],
        "format": "date-time"
      },
      "checkOutDate": {
        "type": [
          "string",
          "null"
        ],
        "format": "date"
      },
      "checkedOutBy": {
        "type": [
          "string",
          "null"
        ],
        "format": "uuid"
      },
      "checkedOutAt": {
        "type": [
          "string",
          "null"
        ],
        "format": "date-time"
      },
      "cancellationReason": {
        "type": [
          "string",
          "null"
        ],
        "minLength": 1,
        "maxLength": 500
      },
      "cancelledBy": {
        "type": [
          "string",
          "null"
        ],
        "format": "uuid"
      },
      "cancelledAt": {
        "type": [
          "string",
          "null"
        ],
        "format": "date-time"
      }
    },
    "required": [
      "id",
      "applicationId",
      "studentId",
      "roomId",
      "status",
      "allocatedBy",
      "allocatedAt",
      "checkInDate",
      "checkedInBy",
      "checkedInAt",
      "checkOutDate",
      "checkedOutBy",
      "checkedOutAt",
      "cancellationReason",
      "cancelledBy",
      "cancelledAt"
    ]
  },
  "Receipt": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "id": {
        "type": "string",
        "format": "uuid"
      },
      "residenceId": {
        "type": "string",
        "format": "uuid"
      },
      "amountVnd": {
        "type": "string",
        "pattern": "^(0|[1-9][0-9]{0,18})$",
        "description": "VND nguyên đồng, giá trị <=9223372036854775807; không ép sang Number."
      },
      "status": {
        "type": "string",
        "enum": [
          "UNPAID",
          "PAID"
        ]
      },
      "createdBy": {
        "type": "string",
        "format": "uuid"
      },
      "createdAt": {
        "type": "string",
        "format": "date-time"
      },
      "paymentDate": {
        "type": [
          "string",
          "null"
        ],
        "format": "date"
      },
      "paidBy": {
        "type": [
          "string",
          "null"
        ],
        "format": "uuid"
      },
      "paidAt": {
        "type": [
          "string",
          "null"
        ],
        "format": "date-time"
      }
    },
    "required": [
      "id",
      "residenceId",
      "amountVnd",
      "status",
      "createdBy",
      "createdAt",
      "paymentDate",
      "paidBy",
      "paidAt"
    ]
  },
  "RegistrationPeriod": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "id": {
        "type": "integer",
        "const": 1
      },
      "status": {
        "type": "string",
        "enum": [
          "OPEN",
          "CLOSED"
        ]
      },
      "updatedBy": {
        "type": [
          "string",
          "null"
        ],
        "format": "uuid"
      },
      "updatedAt": {
        "type": "string",
        "format": "date-time"
      }
    },
    "required": [
      "id",
      "status",
      "updatedBy",
      "updatedAt"
    ]
  },
  "Statistics": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "totalRooms": {
        "type": "integer",
        "minimum": 0
      },
      "availablePlaces": {
        "type": "integer",
        "minimum": 0
      },
      "currentResidents": {
        "type": "integer",
        "minimum": 0
      },
      "unpaidReceipts": {
        "type": "integer",
        "minimum": 0
      }
    },
    "required": [
      "totalRooms",
      "availablePlaces",
      "currentResidents",
      "unpaidReceipts"
    ]
  },
  "ApprovalResult": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "application": {
        "$ref": "#/components/schemas/Application"
      },
      "residence": {
        "$ref": "#/components/schemas/Residence"
      }
    },
    "required": [
      "application",
      "residence"
    ]
  },
  "StudentProfileQuery": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "page": {
        "type": "integer",
        "minimum": 1,
        "default": 1
      },
      "pageSize": {
        "type": "integer",
        "minimum": 1,
        "maximum": 100,
        "default": 20
      },
      "q": {
        "type": "string",
        "maxLength": 100
      },
      "gender": {
        "type": "string",
        "enum": [
          "MALE",
          "FEMALE"
        ]
      }
    },
    "required": []
  },
  "BuildingQuery": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "page": {
        "type": "integer",
        "minimum": 1,
        "default": 1
      },
      "pageSize": {
        "type": "integer",
        "minimum": 1,
        "maximum": 100,
        "default": 20
      },
      "q": {
        "type": "string",
        "maxLength": 100
      }
    },
    "required": []
  },
  "RoomQuery": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "page": {
        "type": "integer",
        "minimum": 1,
        "default": 1
      },
      "pageSize": {
        "type": "integer",
        "minimum": 1,
        "maximum": 100,
        "default": 20
      },
      "q": {
        "type": "string",
        "maxLength": 100
      },
      "buildingId": {
        "type": "string",
        "format": "uuid"
      },
      "gender": {
        "type": "string",
        "enum": [
          "MALE",
          "FEMALE"
        ]
      },
      "hasAvailability": {
        "type": "boolean"
      },
      "status": {
        "type": "string",
        "enum": [
          "ACTIVE",
          "INACTIVE"
        ]
      }
    },
    "required": []
  },
  "ApplicationQuery": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "page": {
        "type": "integer",
        "minimum": 1,
        "default": 1
      },
      "pageSize": {
        "type": "integer",
        "minimum": 1,
        "maximum": 100,
        "default": 20
      },
      "status": {
        "type": "string",
        "enum": [
          "PENDING",
          "APPROVED",
          "REJECTED"
        ]
      },
      "studentId": {
        "type": "string",
        "format": "uuid"
      },
      "preferredRoomId": {
        "type": "string",
        "format": "uuid"
      }
    },
    "required": []
  },
  "ResidenceQuery": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "page": {
        "type": "integer",
        "minimum": 1,
        "default": 1
      },
      "pageSize": {
        "type": "integer",
        "minimum": 1,
        "maximum": 100,
        "default": 20
      },
      "status": {
        "type": "string",
        "enum": [
          "ALLOCATED",
          "CHECKED_IN",
          "ENDED",
          "CANCELLED"
        ]
      },
      "studentId": {
        "type": "string",
        "format": "uuid"
      },
      "roomId": {
        "type": "string",
        "format": "uuid"
      }
    },
    "required": []
  },
  "ReceiptQuery": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "page": {
        "type": "integer",
        "minimum": 1,
        "default": 1
      },
      "pageSize": {
        "type": "integer",
        "minimum": 1,
        "maximum": 100,
        "default": 20
      },
      "status": {
        "type": "string",
        "enum": [
          "UNPAID",
          "PAID"
        ]
      },
      "studentId": {
        "type": "string",
        "format": "uuid"
      },
      "residenceId": {
        "type": "string",
        "format": "uuid"
      }
    },
    "required": []
  },
  "ProfileCreate": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "studentCode": {
        "type": "string",
        "pattern": "^[A-Z0-9][A-Z0-9_-]{0,31}$"
      },
      "fullName": {
        "type": "string",
        "minLength": 1,
        "maxLength": 150
      },
      "gender": {
        "type": "string",
        "enum": [
          "MALE",
          "FEMALE"
        ]
      },
      "className": {
        "type": "string",
        "minLength": 1,
        "maxLength": 100
      },
      "faculty": {
        "type": "string",
        "minLength": 1,
        "maxLength": 100
      },
      "phone": {
        "type": [
          "string",
          "null"
        ],
        "pattern": "^\\+?[0-9]{7,20}$"
      },
      "email": {
        "type": [
          "string",
          "null"
        ],
        "format": "email",
        "maxLength": 254
      },
      "dateOfBirth": {
        "type": [
          "string",
          "null"
        ],
        "format": "date"
      },
      "permanentAddress": {
        "type": [
          "string",
          "null"
        ],
        "minLength": 1,
        "maxLength": 500
      }
    },
    "required": [
      "studentCode",
      "fullName",
      "gender",
      "className",
      "faculty"
    ]
  },
  "ProfilePatch": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "fullName": {
        "type": "string",
        "minLength": 1,
        "maxLength": 150
      },
      "gender": {
        "type": "string",
        "enum": [
          "MALE",
          "FEMALE"
        ]
      },
      "className": {
        "type": "string",
        "minLength": 1,
        "maxLength": 100
      },
      "faculty": {
        "type": "string",
        "minLength": 1,
        "maxLength": 100
      },
      "phone": {
        "type": [
          "string",
          "null"
        ],
        "pattern": "^\\+?[0-9]{7,20}$"
      },
      "email": {
        "type": [
          "string",
          "null"
        ],
        "format": "email",
        "maxLength": 254
      },
      "dateOfBirth": {
        "type": [
          "string",
          "null"
        ],
        "format": "date"
      },
      "permanentAddress": {
        "type": [
          "string",
          "null"
        ],
        "minLength": 1,
        "maxLength": 500
      }
    },
    "required": [],
    "minProperties": 1
  },
  "BuildingCreate": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "code": {
        "type": "string",
        "pattern": "^[A-Z0-9][A-Z0-9_-]{0,31}$"
      },
      "name": {
        "type": "string",
        "minLength": 1,
        "maxLength": 150
      }
    },
    "required": [
      "code",
      "name"
    ]
  },
  "BuildingPatch": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "name": {
        "type": "string",
        "minLength": 1,
        "maxLength": 150
      }
    },
    "required": [
      "name"
    ]
  },
  "RoomCreate": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "buildingId": {
        "type": "string",
        "format": "uuid"
      },
      "code": {
        "type": "string",
        "pattern": "^[A-Z0-9][A-Z0-9_-]{0,31}$"
      },
      "capacity": {
        "type": "integer",
        "minimum": 1,
        "maximum": 10000
      },
      "gender": {
        "type": "string",
        "enum": [
          "MALE",
          "FEMALE"
        ]
      },
      "feeVnd": {
        "type": "string",
        "pattern": "^(0|[1-9][0-9]{0,18})$",
        "description": "VND nguyên đồng, giá trị <=9223372036854775807; không ép sang Number."
      },
      "status": {
        "type": "string",
        "enum": [
          "ACTIVE",
          "INACTIVE"
        ]
      }
    },
    "required": [
      "buildingId",
      "code",
      "capacity",
      "gender",
      "feeVnd",
      "status"
    ]
  },
  "RoomPatch": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "capacity": {
        "type": "integer",
        "minimum": 1,
        "maximum": 10000
      },
      "gender": {
        "type": "string",
        "enum": [
          "MALE",
          "FEMALE"
        ]
      },
      "feeVnd": {
        "type": "string",
        "pattern": "^(0|[1-9][0-9]{0,18})$",
        "description": "VND nguyên đồng, giá trị <=9223372036854775807; không ép sang Number."
      },
      "status": {
        "type": "string",
        "enum": [
          "ACTIVE",
          "INACTIVE"
        ]
      }
    },
    "required": [],
    "minProperties": 1
  },
  "PeriodPatch": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "status": {
        "type": "string",
        "enum": [
          "OPEN",
          "CLOSED"
        ]
      }
    },
    "required": [
      "status"
    ]
  },
  "ApplicationApprove": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "roomId": {
        "type": "string",
        "format": "uuid"
      }
    },
    "required": [
      "roomId"
    ]
  },
  "ApplicationReject": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "reason": {
        "type": "string",
        "minLength": 1,
        "maxLength": 500
      }
    },
    "required": [
      "reason"
    ]
  },
  "CheckIn": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "checkInDate": {
        "type": "string",
        "format": "date"
      }
    },
    "required": [
      "checkInDate"
    ]
  },
  "CancelAllocation": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "reason": {
        "type": "string",
        "minLength": 1,
        "maxLength": 500
      }
    },
    "required": [
      "reason"
    ]
  },
  "CheckOut": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "checkOutDate": {
        "type": "string",
        "format": "date"
      }
    },
    "required": [
      "checkOutDate"
    ]
  },
  "ReceiptCreate": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "residenceId": {
        "type": "string",
        "format": "uuid"
      }
    },
    "required": [
      "residenceId"
    ]
  },
  "ReceiptPay": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "paymentDate": {
        "type": "string",
        "format": "date"
      }
    },
    "required": [
      "paymentDate"
    ]
  }
} as const;
